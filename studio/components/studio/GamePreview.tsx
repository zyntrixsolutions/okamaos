'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Square, RotateCcw, AlertCircle, Loader2, Monitor, Terminal, Wand2, XCircle, Maximize2, Minimize2 } from "lucide-react";

interface GamePreviewProps {
  code: string;
  autoRun?: boolean;
  onSendToAI?: (errorText: string) => void;
}

type RunState = "idle" | "loading" | "running" | "stopping" | "error" | "stopped";

interface LogLine {
  text: string;
  isError: boolean;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  loadPackage: (pkgs: string | string[]) => Promise<void>;
  globals: { get: (name: string) => unknown };
}

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";
const PREVIEW_CANVAS_ID = "okama-preview-canvas";
const PREVIEW_LOG_CALLBACK = "okamaStudioPreviewLog";
const PREVIEW_ERROR_CALLBACK = "okamaStudioPreviewError";
const PREVIEW_STOP_CALLBACK = "okamaStudioPreviewShouldStop";
const GAMEPAD_EVENTS_GLOBAL = "okamaGamepadEvents";
const GAMEPAD_STATES_GLOBAL = "okamaGamepadStates";
const GAMEPAD_COUNT_GLOBAL = "okamaGamepadCount";

const STDIO_SETUP_CODE = `
import sys
import js

if not hasattr(sys, "_okama_original_stdout"):
    sys._okama_original_stdout = getattr(sys, "__stdout__", sys.stdout)
if not hasattr(sys, "_okama_original_stderr"):
    sys._okama_original_stderr = getattr(sys, "__stderr__", sys.stderr)

def _okama_emit(text, is_err=False):
    callback_name = "${PREVIEW_ERROR_CALLBACK}" if is_err else "${PREVIEW_LOG_CALLBACK}"
    try:
        callback = getattr(js, callback_name)
    except Exception:
        callback = None

    if callback is not None:
        try:
            callback(str(text))
            return
        except Exception:
            pass

    fallback = sys._okama_original_stderr if is_err else sys._okama_original_stdout
    try:
        fallback.write(str(text))
        fallback.flush()
    except Exception:
        pass

class _OkamaStudioStdIO:
    encoding = "utf-8"
    errors = "replace"

    def __init__(self, is_err=False):
        self.is_err = is_err
        self.buffer = ""

    def write(self, value):
        text = str(value)
        self.buffer += text
        lines = self.buffer.split("\\n")
        self.buffer = lines.pop()
        for line in lines:
            if line:
                _okama_emit(line, self.is_err)
        return len(text)

    def flush(self):
        if self.buffer:
            _okama_emit(self.buffer, self.is_err)
            self.buffer = ""

    def isatty(self):
        return False

    def writable(self):
        return True

sys.stdout = _OkamaStudioStdIO(False)
sys.stderr = _OkamaStudioStdIO(True)
`;

const STDIO_TEARDOWN_CODE = `
import sys

try:
    sys.stdout.flush()
except Exception:
    pass
try:
    sys.stderr.flush()
except Exception:
    pass

if hasattr(sys, "_okama_original_stdout"):
    sys.stdout = sys._okama_original_stdout
if hasattr(sys, "_okama_original_stderr"):
    sys.stderr = sys._okama_original_stderr
`;

const CODE_TRANSFORM_CODE = `
import ast as _ok_ast

def _ok_collect_async_funcs(tree):
    """Names of top-level defs that contain a while loop (direct or nested)."""
    result = set()
    for node in tree.body:
        if isinstance(node, _ok_ast.FunctionDef):
            if any(isinstance(n, _ok_ast.While) for n in _ok_ast.walk(node)):
                result.add(node.name)
    return result

def _ok_make_stop_check():
    n = _ok_ast.If(
        test=_ok_ast.Call(
            func=_ok_ast.Name(id='_okama_preview_should_stop', ctx=_ok_ast.Load()),
            args=[], keywords=[]),
        body=[_ok_ast.Raise(
            exc=_ok_ast.Call(
                func=_ok_ast.Name(id='_OkamaPreviewStopped', ctx=_ok_ast.Load()),
                args=[], keywords=[]),
            cause=None)],
        orelse=[])
    _ok_ast.fix_missing_locations(n)
    return n

def _ok_make_await_sleep():
    n = _ok_ast.Expr(value=_ok_ast.Await(
        value=_ok_ast.Call(
            func=_ok_ast.Attribute(
                value=_ok_ast.Name(id='asyncio', ctx=_ok_ast.Load()),
                attr='sleep', ctx=_ok_ast.Load()),
            args=[_ok_ast.Constant(value=0)], keywords=[])))
    _ok_ast.fix_missing_locations(n)
    return n

def _ok_make_loop_checkpoint():
    return [_ok_make_stop_check(), _ok_make_await_sleep()]

class _OkamaTransformer(_ok_ast.NodeTransformer):
    def __init__(self, async_funcs):
        self._af = set(async_funcs)
        self._in_sync = 0

    def visit_FunctionDef(self, node):
        if node.name in self._af:
            new = _ok_ast.AsyncFunctionDef(
                name=node.name, args=node.args, body=node.body,
                decorator_list=node.decorator_list, returns=node.returns,
                lineno=node.lineno, col_offset=node.col_offset)
            _ok_ast.copy_location(new, node)
            _ok_ast.fix_missing_locations(new)
            self.generic_visit(new)
            return new
        self._in_sync += 1
        result = self.generic_visit(node)
        self._in_sync -= 1
        return result

    def visit_AsyncFunctionDef(self, node):
        return self.generic_visit(node)

    def visit_While(self, node):
        self.generic_visit(node)
        if self._in_sync > 0:
            return node
        node.body[0:0] = _ok_make_loop_checkpoint()
        return node

    def visit_Expr(self, node):
        val = node.value
        if isinstance(val, _ok_ast.Call):
            func = val.func
            name = func.id if isinstance(func, _ok_ast.Name) else None
            if name and name in self._af:
                new = _ok_ast.Expr(value=_ok_ast.Await(value=val))
                _ok_ast.copy_location(new, node)
                _ok_ast.fix_missing_locations(new)
                return new
        return self.generic_visit(node)

    def visit_If(self, node):
        t = node.test
        if (isinstance(t, _ok_ast.Compare)
                and isinstance(t.left, _ok_ast.Name) and t.left.id == '__name__'
                and len(t.ops) == 1 and isinstance(t.ops[0], _ok_ast.Eq)
                and len(t.comparators) == 1
                and isinstance(t.comparators[0], _ok_ast.Constant)
                and t.comparators[0].value == '__main__'):
            out = []
            for s in node.body:
                v = self.visit(s)
                if isinstance(v, list):
                    out.extend(v)
                elif v is not None:
                    out.append(v)
            return out
        return self.generic_visit(node)

try:
    _ok_tree = _ok_ast.parse(_okama_raw_src)
    _ok_af = _ok_collect_async_funcs(_ok_tree)
    _ok_tree = _OkamaTransformer(_ok_af).visit(_ok_tree)
    _ok_ast.fix_missing_locations(_ok_tree)
    _ok_imp = _ok_ast.Import(names=[_ok_ast.alias(name='asyncio')])
    _ok_ast.fix_missing_locations(_ok_imp)
    _ok_js_imp = _ok_ast.Import(names=[_ok_ast.alias(name='js', asname='_ok_js')])
    _ok_ast.fix_missing_locations(_ok_js_imp)
    _ok_stop_helpers = _ok_ast.parse("""
class _OkamaPreviewStopped(Exception):
    pass

def _okama_preview_should_stop():
    try:
        callback = getattr(_ok_js, '${PREVIEW_STOP_CALLBACK}')
    except Exception:
        return False
    try:
        return bool(callback())
    except Exception:
        return False
""").body
    _ok_wrap = _ok_ast.AsyncFunctionDef(
        name='_okama_game_main',
        args=_ok_ast.arguments(posonlyargs=[], args=[], vararg=None,
                               kwonlyargs=[], kw_defaults=[], kwarg=None, defaults=[]),
        body=_ok_tree.body, decorator_list=[], returns=None, lineno=1, col_offset=0)
    _ok_ast.fix_missing_locations(_ok_wrap)
    _ok_final = _ok_ast.Module(body=[_ok_imp, _ok_js_imp, *_ok_stop_helpers, _ok_wrap], type_ignores=[])
    _ok_ast.fix_missing_locations(_ok_final)
    _okama_transformed_src = _ok_ast.unparse(_ok_final) + "\\nawait _okama_game_main()"
except Exception as _ok_err:
    _okama_transformed_src = _okama_raw_src
`;

let pyodidePromise: Promise<PyodideInterface> | null = null;

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = async () => {
      try {
        if (!window.loadPyodide) throw new Error("loadPyodide not found");
        const py = await window.loadPyodide({ indexURL: PYODIDE_CDN });
        resolve(py);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(script);
  });
  return pyodidePromise;
}

// Setup pygame for browser - creates stubs that work with HTML Canvas
const PYGAME_SETUP_CODE = `
import sys
import js
from pyodide.ffi import create_proxy, to_js
import math

try:
    _okama_cleanup_input()
except Exception:
    pass

_okama_input_bindings = []

def _okama_cleanup_input():
    global _okama_input_bindings
    for target, event_name, proxy in list(_okama_input_bindings):
        try:
            target.removeEventListener(event_name, proxy)
        except Exception:
            pass
    _okama_input_bindings = []

def _okama_add_listener(target, event_name, handler):
    proxy = create_proxy(handler)
    target.addEventListener(event_name, proxy)
    _okama_input_bindings.append((target, event_name, proxy))

def _ok_color_style(color):
    r, g, b = color[0], color[1], color[2]
    if len(color) > 3:
        return f"rgba({r},{g},{b},{color[3] / 255})"
    return f"rgb({r},{g},{b})"

def _ok_preview_canvas():
    try:
        canvas = js.document.getElementById("${PREVIEW_CANVAS_ID}")
        if canvas is not None:
            return canvas
    except Exception:
        pass
    try:
        canvases = js.document.getElementsByTagName("canvas")
        if canvases.length > 0:
            return canvases.item(0)
    except Exception:
        pass
    return None

def _ok_point_tuple(point):
    if hasattr(point, "x") and hasattr(point, "y"):
        return int(point.x), int(point.y)
    return int(point[0]), int(point[1])

def _ok_rect_tuple(rect):
    if hasattr(rect, "x") and hasattr(rect, "y"):
        w = getattr(rect, "width", getattr(rect, "w", None))
        h = getattr(rect, "height", getattr(rect, "h", None))
        if w is not None and h is not None:
            return int(rect.x), int(rect.y), int(w), int(h)

    try:
        if len(rect) == 2 and len(rect[0]) == 2 and len(rect[1]) == 2:
            x, y = rect[0]
            w, h = rect[1]
            return int(x), int(y), int(w), int(h)
    except Exception:
        pass

    try:
        x, y, w, h = rect
        return int(x), int(y), int(w), int(h)
    except Exception as exc:
        raise TypeError(f"expected a rect-like value, got {type(rect).__name__}") from exc

# --- Pygame Browser Stubs ---
class _CanvasSurface:
    """A pygame.Surface replacement that renders to HTML Canvas"""
    def __init__(self, size_or_width, height=None, flags=0, depth=0, masks=None, bind_display=False):
        if isinstance(size_or_width, (tuple, list)):
            width, surface_height = size_or_width
            if isinstance(height, int) and flags == 0:
                flags = height
            height = surface_height
        else:
            width = size_or_width
            height = 0 if height is None else height

        self.width = max(1, int(width))
        self.height = max(1, int(height))
        self.flags = flags
        self._bind_display = bind_display
        self._canvas = None
        self._ctx = None
        self._init_canvas()
    
    def _init_canvas(self):
        try:
            if self._bind_display:
                self._canvas = _ok_preview_canvas()
            else:
                self._canvas = js.document.createElement("canvas")
            if self._canvas is not None:
                self._canvas.width = self.width
                self._canvas.height = self.height
                self._ctx = self._canvas.getContext("2d")
                try:
                    self._ctx.imageSmoothingEnabled = False
                except Exception:
                    pass
        except Exception:
            pass
    
    def fill(self, color):
        if self._ctx:
            self._ctx.fillStyle = _ok_color_style(color)
            self._ctx.fillRect(0, 0, self.width, self.height)
    
    def blit(self, source, dest, area=None):
        if not self._ctx or not hasattr(source, "_canvas") or source._canvas is None:
            x, y = _ok_point_tuple(dest.topleft if hasattr(dest, "topleft") else dest)
            return _Rect(x, y, 0, 0)
        x, y = _ok_point_tuple(dest.topleft if hasattr(dest, "topleft") else dest)
        if area is not None:
            sx, sy, sw, sh = _ok_rect_tuple(area)
            self._ctx.drawImage(source._canvas, sx, sy, sw, sh, x, y, sw, sh)
            return _Rect(x, y, sw, sh)
        self._ctx.drawImage(source._canvas, x, y)
        return _Rect(x, y, source.get_width(), source.get_height())

    def get_rect(self, **kwargs):
        rect = _Rect(0, 0, self.width, self.height)
        for key, value in kwargs.items():
            setattr(rect, key, value)
        return rect

    def get_width(self):
        return self.width
    
    def get_height(self):
        return self.height
    
    def convert(self):
        return self
    
    def convert_alpha(self):
        return self
    
    def set_colorkey(self, color):
        pass
    
    def set_alpha(self, alpha):
        pass

class _Rect:
    """pygame.Rect replacement"""
    def __init__(self, *args, **kwargs):
        if len(args) == 1:
            x, y, w, h = _ok_rect_tuple(args[0])
        elif len(args) == 2:
            x, y = _ok_point_tuple(args[0])
            w, h = _ok_point_tuple(args[1])
        elif len(args) == 4:
            x, y, w, h = args
        else:
            raise TypeError("Rect expected Rect, (x, y, w, h), ((x, y), (w, h)), or x, y, w, h")
        self.x = int(x)
        self.y = int(y)
        self.width = int(w)
        self.height = int(h)
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __iter__(self):
        yield self.x
        yield self.y
        yield self.width
        yield self.height

    def __len__(self):
        return 4

    def __getitem__(self, index):
        return (self.x, self.y, self.width, self.height)[index]

    @property
    def w(self):
        return self.width

    @w.setter
    def w(self, value):
        self.width = int(value)

    @property
    def h(self):
        return self.height

    @h.setter
    def h(self, value):
        self.height = int(value)

    @property
    def left(self):
        return self.x

    @left.setter
    def left(self, value):
        self.x = int(value)

    @property
    def top(self):
        return self.y

    @top.setter
    def top(self, value):
        self.y = int(value)

    @property
    def right(self):
        return self.x + self.width

    @right.setter
    def right(self, value):
        self.x = int(value) - self.width

    @property
    def bottom(self):
        return self.y + self.height

    @bottom.setter
    def bottom(self, value):
        self.y = int(value) - self.height

    @property
    def centerx(self):
        return self.x + self.width // 2

    @centerx.setter
    def centerx(self, value):
        self.x = int(value) - self.width // 2

    @property
    def centery(self):
        return self.y + self.height // 2

    @centery.setter
    def centery(self, value):
        self.y = int(value) - self.height // 2

    @property
    def topleft(self):
        return (self.x, self.y)

    @topleft.setter
    def topleft(self, value):
        self.x, self.y = _ok_point_tuple(value)

    @property
    def topright(self):
        return (self.right, self.y)

    @topright.setter
    def topright(self, value):
        x, y = _ok_point_tuple(value)
        self.right = x
        self.y = y

    @property
    def bottomleft(self):
        return (self.x, self.bottom)

    @bottomleft.setter
    def bottomleft(self, value):
        x, y = _ok_point_tuple(value)
        self.x = x
        self.bottom = y

    @property
    def bottomright(self):
        return (self.right, self.bottom)

    @bottomright.setter
    def bottomright(self, value):
        x, y = _ok_point_tuple(value)
        self.right = x
        self.bottom = y

    @property
    def center(self):
        return (self.centerx, self.centery)

    @center.setter
    def center(self, value):
        self.centerx, self.centery = _ok_point_tuple(value)

    @property
    def midleft(self):
        return (self.x, self.centery)

    @midleft.setter
    def midleft(self, value):
        x, y = _ok_point_tuple(value)
        self.x = x
        self.centery = y

    @property
    def midright(self):
        return (self.right, self.centery)

    @midright.setter
    def midright(self, value):
        x, y = _ok_point_tuple(value)
        self.right = x
        self.centery = y

    @property
    def midtop(self):
        return (self.centerx, self.y)

    @midtop.setter
    def midtop(self, value):
        x, y = _ok_point_tuple(value)
        self.centerx = x
        self.y = y

    @property
    def midbottom(self):
        return (self.centerx, self.bottom)

    @midbottom.setter
    def midbottom(self, value):
        x, y = _ok_point_tuple(value)
        self.centerx = x
        self.bottom = y

    @property
    def size(self):
        return (self.width, self.height)

    @size.setter
    def size(self, value):
        self.width, self.height = _ok_point_tuple(value)
    
    def copy(self):
        return _Rect(self.x, self.y, self.width, self.height)
    
    def move(self, x, y):
        return _Rect(self.x + x, self.y + y, self.width, self.height)
    
    def move_ip(self, x, y):
        self.x += x
        self.y += y
        self._update()
    
    def _update(self):
        pass
    
    def inflate(self, x, y):
        return _Rect(self.x - x//2, self.y - y//2, self.width + x, self.height + y)
    
    def inflate_ip(self, x, y):
        self.x -= x//2
        self.y -= y//2
        self.width += x
        self.height += y
        self._update()
    
    def clamp(self, rect):
        result = self.copy()
        result.clamp_ip(rect)
        return result
    
    def clamp_ip(self, rect):
        x, y, w, h = _ok_rect_tuple(rect)
        if self.width >= w:
            self.x = x + (w - self.width) // 2
        else:
            self.left = max(x, min(self.left, x + w - self.width))
        if self.height >= h:
            self.y = y + (h - self.height) // 2
        else:
            self.top = max(y, min(self.top, y + h - self.height))
    
    def clip(self, rect):
        x, y, w, h = _ok_rect_tuple(rect)
        left = max(self.left, x)
        top = max(self.top, y)
        right = min(self.right, x + w)
        bottom = min(self.bottom, y + h)
        if right <= left or bottom <= top:
            return _Rect(0, 0, 0, 0)
        return _Rect(left, top, right - left, bottom - top)
    
    def union(self, rect):
        x, y, w, h = _ok_rect_tuple(rect)
        left = min(self.left, x)
        top = min(self.top, y)
        right = max(self.right, x + w)
        bottom = max(self.bottom, y + h)
        return _Rect(left, top, right - left, bottom - top)
    
    def union_ip(self, rect):
        merged = self.union(rect)
        self.x, self.y, self.width, self.height = merged.x, merged.y, merged.width, merged.height
    
    def contains(self, rect):
        x, y, w, h = _ok_rect_tuple(rect)
        return (self.left <= x and self.right >= x + w and
                self.top <= y and self.bottom >= y + h)
    
    def collidepoint(self, x, y=None):
        if y is None:
            x, y = _ok_point_tuple(x)
        return self.left <= x < self.right and self.top <= y < self.bottom
    
    def colliderect(self, rect):
        x, y, w, h = _ok_rect_tuple(rect)
        return (self.left < x + w and self.right > x and
                self.top < y + h and self.bottom > y)

class _Event:
    def __init__(self, type, attributes=None, **kwargs):
        self.type = type
        if attributes:
            self.__dict__.update(attributes)
        self.__dict__.update(kwargs)

class _Display:
    """pygame.display replacement"""
    def __init__(self):
        self._surface = None
        self._w = 800
        self._h = 500
        self._init = False
    
    def set_mode(self, size, flags=0, depth=0):
        if not size or size[0] <= 0 or size[1] <= 0:
            self._w, self._h = 800, 500
        else:
            self._w, self._h = int(size[0]), int(size[1])
        self._surface = _CanvasSurface(self._w, self._h, flags=flags, depth=depth, bind_display=True)
        self._surface.fill((16, 18, 15))
        self._init = True
        try:
            pygame_module = sys.modules.get('pygame')
            if pygame_module is not None:
                pygame_module._okama_bind_canvas(self._surface._canvas)
        except Exception:
            pass
        return self._surface
    
    def flip(self):
        pass
    
    def update(self, rect=None):
        pass
    
    def set_caption(self, title):
        pass
    
    def get_surface(self):
        return self._surface
    
    def get_width(self):
        return self._w
    
    def get_height(self):
        return self._h

class _Time:
    """pygame.time replacement"""
    def __init__(self):
        import time as _time
        self._time = _time
        self._start = _time.time()
    
    def get_ticks(self):
        return int((self._time.time() - self._start) * 1000)
    
    def delay(self, milliseconds):
        pass
    
    def wait(self, milliseconds):
        pass
    
    class Clock:
        def __init__(self):
            import time as _time
            self._time = _time
            self._last = _time.time()
            self._fps = 60
        
        def tick(self, framerate=0):
            now = self._time.time()
            elapsed = now - self._last
            self._last = now
            if elapsed > 0:
                self._fps = 1.0 / elapsed
            return int(elapsed * 1000)
        
        def get_fps(self):
            return self._fps
        
        def tick_busy_loop(self, framerate=0):
            return self.tick(framerate)

class _PressedKeys:
    def __init__(self, pressed_keys):
        self._pressed_keys = set(pressed_keys)

    def __getitem__(self, key):
        return int(key) in self._pressed_keys

    def __len__(self):
        return 512

class _Key:
    """pygame.key replacement"""
    def __init__(self, runtime):
        self._runtime = runtime

    def get_pressed(self):
        return _PressedKeys(self._runtime._pressed_keys)
    
    def get_mods(self):
        return self._runtime._mods
    
    def set_mods(self, mods):
        self._runtime._mods = int(mods)
    
    def set_repeat(self, delay=0, interval=0):
        pass
    
    def get_repeat(self):
        return (0, 0)
    
    def name(self, key):
        return str(key)

class _Mouse:
    """pygame.mouse replacement"""
    def __init__(self, runtime):
        self._runtime = runtime

    def get_pos(self):
        return self._runtime._mouse_pos
    
    def get_rel(self):
        rel = self._runtime._mouse_rel
        self._runtime._mouse_rel = (0, 0)
        return rel
    
    def get_pressed(self):
        return tuple(button in self._runtime._mouse_buttons for button in (1, 2, 3))
    
    def set_pos(self, pos):
        self._runtime._mouse_pos = _ok_point_tuple(pos)
    
    def set_visible(self, visible):
        pass
    
    def get_visible(self):
        return True
    
    def get_focused(self):
        return self._runtime._focused
    
    def set_cursor(self, *args):
        pass
    
    def get_cursor(self):
        return None

class _EventModule:
    """pygame.event replacement"""
    def __init__(self):
        self._queue = []

    def _matches(self, event, eventtype):
        if eventtype is None:
            return True
        if isinstance(eventtype, (list, tuple, set)):
            return event.type in eventtype
        return event.type == eventtype
    
    def get(self, eventtype=None):
        _drain_gamepad_events(self)
        events = [event for event in self._queue if self._matches(event, eventtype)]
        self._queue = [event for event in self._queue if not self._matches(event, eventtype)]
        return events
    
    def poll(self):
        _drain_gamepad_events(self)
        if self._queue:
            return self._queue.pop(0)
        return _Event(0)  # NOEVENT
    
    def wait(self):
        return _Event(0)
    
    def peek(self, eventtype=None):
        return any(self._matches(event, eventtype) for event in self._queue)
    
    def clear(self, eventtype=None):
        self._queue = [event for event in self._queue if not self._matches(event, eventtype)]
    
    def post(self, event):
        self._queue.append(event)
    
    def set_allowed(self, eventtype):
        pass
    
    def set_blocked(self, eventtype):
        pass
    
    def get_blocked(self, eventtype):
        return False

class _Font:
    """pygame.font replacement"""
    def __init__(self):
        self._init = False
    
    def init(self):
        self._init = True
    
    def quit(self):
        self._init = False
    
    def get_init(self):
        return self._init
    
    def get_default_font(self):
        return "monospace"
    
    def get_fonts(self):
        return ["monospace"]
    
    def match_font(self, name, bold=0, italic=0):
        return None
    
    def SysFont(self, name, size, bold=False, italic=False, constructor=None):
        return _FontObj(name, size, bold, italic)

class _FontObj:
    def __init__(self, name, size, bold=False, italic=False):
        self.name = name
        self.point_size = int(size)
        self.bold = bold
        self.italic = italic
        self.underline = False
    
    def render(self, text, antialias, color, background=None):
        text = str(text)
        font_weight = "bold " if self.bold else ""
        font_style = "italic " if self.italic else ""
        family = self.name or "monospace"
        measure = js.document.createElement("canvas").getContext("2d")
        measure.font = f"{font_style}{font_weight}{self.point_size}px {family}, monospace"
        try:
            width = int(measure.measureText(text).width) + 6
        except Exception:
            width = len(text) * self.point_size // 2 + 6
        height = self.point_size + 8
        surf = _CanvasSurface(max(1, width), max(1, height))
        if background is not None:
            surf.fill(background)
        if surf._ctx:
            surf._ctx.font = measure.font
            surf._ctx.textBaseline = "top"
            surf._ctx.fillStyle = _ok_color_style(color)
            surf._ctx.fillText(text, 3, 3)
            if self.underline:
                surf._ctx.fillRect(3, height - 3, max(1, width - 6), 1)
        return surf
    
    def size(self, text):
        text = str(text)
        return (len(text) * self.point_size // 2 + 6, self.point_size + 8)
    
    def set_underline(self, underline):
        self.underline = bool(underline)
    
    def get_underline(self):
        return self.underline
    
    def set_bold(self, bold):
        self.bold = bool(bold)
    
    def get_bold(self):
        return self.bold
    
    def set_italic(self, italic):
        self.italic = bool(italic)
    
    def get_italic(self):
        return self.italic

class _Mixer:
    """pygame.mixer replacement - stub"""
    def init(self, frequency=44100, size=-16, channels=2, buffer=512):
        pass
    
    def quit(self):
        pass
    
    def get_init(self):
        return True
    
    def stop(self):
        pass
    
    def pause(self):
        pass
    
    def unpause(self):
        pass
    
    def set_num_channels(self, count):
        pass
    
    def get_num_channels(self):
        return 8
    
    def set_reserved(self, num):
        pass
    
    def find_channel(self, force=False):
        return None
    
    def get_busy(self):
        return False

def _drain_gamepad_events(event_module):
    """Drain JS okamaGamepadEvents into pygame's event queue."""
    try:
        events_js = getattr(js, '${GAMEPAD_EVENTS_GLOBAL}', None)
        if events_js is None or not hasattr(events_js, 'length'):
            return
        n = int(events_js.length)
        for i in range(n):
            try:
                ev = events_js[i]
                ev_type = str(getattr(ev, 'type', ''))
                joy = int(getattr(ev, 'joy', 0))
                if ev_type == 'JOYBUTTONDOWN':
                    btn = int(getattr(ev, 'button', 0))
                    event_module._queue.append(_Event(JOYBUTTONDOWN, joy=joy, button=btn))
                elif ev_type == 'JOYBUTTONUP':
                    btn = int(getattr(ev, 'button', 0))
                    event_module._queue.append(_Event(JOYBUTTONUP, joy=joy, button=btn))
                elif ev_type == 'JOYAXISMOTION':
                    axis = int(getattr(ev, 'axis', 0))
                    val = float(getattr(ev, 'value', 0.0))
                    event_module._queue.append(_Event(JOYAXISMOTION, joy=joy, axis=axis, value=val))
            except Exception:
                pass
        try:
            events_js.length = 0
        except Exception:
            pass
    except Exception:
        pass

class _JoystickInstance:
    """A single gamepad, reads live from okamaGamepadStates."""
    def __init__(self, index):
        self._index = index
        self._init = False

    def init(self):
        self._init = True

    def quit(self):
        self._init = False

    def get_init(self):
        return self._init

    def get_id(self):
        return self._index

    def get_name(self):
        return f'Controller {self._index}'

    def _get_state(self):
        try:
            states = getattr(js, '${GAMEPAD_STATES_GLOBAL}', None)
            if states is None or not hasattr(states, 'length'):
                return None
            if self._index >= int(states.length):
                return None
            return states[self._index]
        except Exception:
            return None

    def get_numaxes(self):
        st = self._get_state()
        try:
            return int(st.axes.length) if st is not None else 0
        except Exception:
            return 0

    def get_numbuttons(self):
        st = self._get_state()
        try:
            return int(st.buttons.length) if st is not None else 0
        except Exception:
            return 0

    def get_numhats(self):
        return 0

    def get_axis(self, axis_num):
        st = self._get_state()
        try:
            return float(st.axes[axis_num]) if st is not None else 0.0
        except Exception:
            return 0.0

    def get_button(self, button_num):
        st = self._get_state()
        try:
            return bool(st.buttons[button_num].pressed) if st is not None else False
        except Exception:
            return False

    def get_hat(self, hat_num):
        return (0, 0)


class _Joystick:
    """pygame.joystick — backed by the browser Gamepad API via okamaGamepadStates"""
    def init(self):
        pass

    def quit(self):
        pass

    def get_init(self):
        return True

    def get_count(self):
        try:
            count = getattr(js, '${GAMEPAD_COUNT_GLOBAL}', None)
            return int(count) if count is not None else 0
        except Exception:
            return 0

    def Joystick(self, index):
        inst = _JoystickInstance(index)
        inst.init()
        return inst

class _Draw:
    """pygame.draw replacement"""
    def rect(self, surface, color, rect, width=0, border_radius=0):
        if surface._ctx:
            style = _ok_color_style(color)
            surface._ctx.fillStyle = style
            surface._ctx.strokeStyle = style
            x, y, w, h = _ok_rect_tuple(rect)
            
            if width == 0:
                if border_radius and hasattr(surface._ctx, "roundRect"):
                    surface._ctx.beginPath()
                    surface._ctx.roundRect(x, y, w, h, border_radius)
                    surface._ctx.fill()
                else:
                    surface._ctx.fillRect(x, y, w, h)
            else:
                surface._ctx.lineWidth = width
                if border_radius and hasattr(surface._ctx, "roundRect"):
                    surface._ctx.beginPath()
                    surface._ctx.roundRect(x, y, w, h, border_radius)
                    surface._ctx.stroke()
                else:
                    surface._ctx.strokeRect(x, y, w, h)
        return _Rect(*_ok_rect_tuple(rect))
    
    def circle(self, surface, color, center, radius, width=0):
        if surface._ctx:
            x, y = _ok_point_tuple(center)
            style = _ok_color_style(color)
            surface._ctx.beginPath()
            surface._ctx.arc(x, y, radius, 0, 2 * math.pi)
            if width == 0:
                surface._ctx.fillStyle = style
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = style
                surface._ctx.stroke()
        x, y = _ok_point_tuple(center)
        return _Rect(x - radius, y - radius, radius * 2, radius * 2)
    
    def line(self, surface, color, start_pos, end_pos, width=1):
        if surface._ctx:
            sx, sy = _ok_point_tuple(start_pos)
            ex, ey = _ok_point_tuple(end_pos)
            surface._ctx.beginPath()
            surface._ctx.moveTo(sx, sy)
            surface._ctx.lineTo(ex, ey)
            surface._ctx.lineWidth = width
            surface._ctx.strokeStyle = _ok_color_style(color)
            surface._ctx.stroke()
        sx, sy = _ok_point_tuple(start_pos)
        ex, ey = _ok_point_tuple(end_pos)
        return _Rect(min(sx, ex), min(sy, ey), abs(ex - sx) or width, abs(ey - sy) or width)
    
    def lines(self, surface, color, closed, pointlist, width=1):
        if surface._ctx and len(pointlist) > 1:
            x, y = _ok_point_tuple(pointlist[0])
            surface._ctx.beginPath()
            surface._ctx.moveTo(x, y)
            for p in pointlist[1:]:
                px, py = _ok_point_tuple(p)
                surface._ctx.lineTo(px, py)
            if closed:
                surface._ctx.closePath()
            surface._ctx.lineWidth = width
            surface._ctx.strokeStyle = _ok_color_style(color)
            surface._ctx.stroke()
        return _Rect(0, 0, 0, 0)
    
    def polygon(self, surface, color, pointlist, width=0):
        if surface._ctx and len(pointlist) > 2:
            x, y = _ok_point_tuple(pointlist[0])
            surface._ctx.beginPath()
            surface._ctx.moveTo(x, y)
            for p in pointlist[1:]:
                px, py = _ok_point_tuple(p)
                surface._ctx.lineTo(px, py)
            surface._ctx.closePath()
            if width == 0:
                surface._ctx.fillStyle = _ok_color_style(color)
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = _ok_color_style(color)
                surface._ctx.stroke()
        return _Rect(0, 0, 0, 0)
    
    def ellipse(self, surface, color, rect, width=0, **kwargs):
        if surface._ctx:
            x, y, w, h = _ok_rect_tuple(rect)
            surface._ctx.beginPath()
            surface._ctx.ellipse(x + w//2, y + h//2, w//2, h//2, 0, 0, 2 * math.pi)
            if width == 0:
                surface._ctx.fillStyle = _ok_color_style(color)
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = _ok_color_style(color)
                surface._ctx.stroke()
        return _Rect(*_ok_rect_tuple(rect))
    
    def arc(self, surface, color, rect, start_angle, stop_angle, width=1):
        pass

# Key constants
class _KeyConst:
    K_BACKSPACE = 8
    K_TAB = 9
    K_CLEAR = 12
    K_RETURN = 13
    K_PAUSE = 19
    K_ESCAPE = 27
    K_SPACE = 32
    K_EXCLAIM = 33
    K_QUOTEDBL = 34
    K_HASH = 35
    K_DOLLAR = 36
    K_AMPERSAND = 38
    K_QUOTE = 39
    K_LEFTPAREN = 40
    K_RIGHTPAREN = 41
    K_ASTERISK = 42
    K_PLUS = 43
    K_COMMA = 44
    K_MINUS = 45
    K_PERIOD = 46
    K_SLASH = 47
    K_0 = 48
    K_1 = 49
    K_2 = 50
    K_3 = 51
    K_4 = 52
    K_5 = 53
    K_6 = 54
    K_7 = 55
    K_8 = 56
    K_9 = 57
    K_COLON = 58
    K_SEMICOLON = 59
    K_LESS = 60
    K_EQUALS = 61
    K_GREATER = 62
    K_QUESTION = 63
    K_AT = 64
    K_LEFTBRACKET = 91
    K_BACKSLASH = 92
    K_RIGHTBRACKET = 93
    K_CARET = 94
    K_UNDERSCORE = 95
    K_BACKQUOTE = 96
    K_a = 97
    K_b = 98
    K_c = 99
    K_d = 100
    K_e = 101
    K_f = 102
    K_g = 103
    K_h = 104
    K_i = 105
    K_j = 106
    K_k = 107
    K_l = 108
    K_m = 109
    K_n = 110
    K_o = 111
    K_p = 112
    K_q = 113
    K_r = 114
    K_s = 115
    K_t = 116
    K_u = 117
    K_v = 118
    K_w = 119
    K_x = 120
    K_y = 121
    K_z = 122
    K_DELETE = 127
    K_KP0 = 256
    K_KP1 = 257
    K_KP2 = 258
    K_KP3 = 259
    K_KP4 = 260
    K_KP5 = 261
    K_KP6 = 262
    K_KP7 = 263
    K_KP8 = 264
    K_KP9 = 265
    K_KP_PERIOD = 266
    K_KP_DIVIDE = 267
    K_KP_MULTIPLY = 268
    K_KP_MINUS = 269
    K_KP_PLUS = 270
    K_KP_ENTER = 271
    K_KP_EQUALS = 272
    K_UP = 273
    K_DOWN = 274
    K_RIGHT = 275
    K_LEFT = 276
    K_INSERT = 277
    K_HOME = 278
    K_END = 279
    K_PAGEUP = 280
    K_PAGEDOWN = 281
    K_F1 = 282
    K_F2 = 283
    K_F3 = 284
    K_F4 = 285
    K_F5 = 286
    K_F6 = 287
    K_F7 = 288
    K_F8 = 289
    K_F9 = 290
    K_F10 = 291
    K_F11 = 292
    K_F12 = 293
    K_F13 = 294
    K_F14 = 295
    K_F15 = 296
    K_NUMLOCK = 300
    K_CAPSLOCK = 301
    K_SCROLLOCK = 302
    K_RSHIFT = 303
    K_LSHIFT = 304
    K_RCTRL = 305
    K_LCTRL = 306
    K_RALT = 307
    K_LALT = 308
    K_RMETA = 309
    K_LMETA = 310
    K_LSUPER = 311
    K_RSUPER = 312
    K_MODE = 313
    K_HELP = 315
    K_PRINT = 316
    K_SYSREQ = 317
    K_BREAK = 318
    K_MENU = 319
    K_POWER = 320
    K_EURO = 321
    K_AC_BACK = 322

KMOD_NONE = 0
KMOD_LSHIFT = 1
KMOD_RSHIFT = 2
KMOD_SHIFT = KMOD_LSHIFT | KMOD_RSHIFT
KMOD_LCTRL = 64
KMOD_RCTRL = 128
KMOD_CTRL = KMOD_LCTRL | KMOD_RCTRL
KMOD_LALT = 256
KMOD_RALT = 512
KMOD_ALT = KMOD_LALT | KMOD_RALT
KMOD_LMETA = 1024
KMOD_RMETA = 2048
KMOD_META = KMOD_LMETA | KMOD_RMETA

# Event type constants
NOEVENT = 0
QUIT = 12
ACTIVEEVENT = 1
KEYDOWN = 2
KEYUP = 3
MOUSEMOTION = 4
MOUSEBUTTONUP = 5
MOUSEBUTTONDOWN = 6
JOYAXISMOTION = 7
JOYBALLMOTION = 8
JOYHATMOTION = 9
JOYBUTTONUP = 10
JOYBUTTONDOWN = 11
VIDEORESIZE = 16
VIDEOEXPOSE = 17
USEREVENT = 24

# Display mode flags
SRCALPHA = 0x00010000
FULLSCREEN = 0x80000000
DOUBLEBUF = 0x40000000
HWSURFACE = 0x10000000
OPENGL = 0x00000002
RESIZABLE = 0x00000010
NOFRAME = 0x00000020
SCALED = 0x00004000

_KEY_NAME_MAP = {
    "ArrowUp": _KeyConst.K_UP,
    "ArrowDown": _KeyConst.K_DOWN,
    "ArrowLeft": _KeyConst.K_LEFT,
    "ArrowRight": _KeyConst.K_RIGHT,
    "Backspace": _KeyConst.K_BACKSPACE,
    "Tab": _KeyConst.K_TAB,
    "Enter": _KeyConst.K_RETURN,
    "Escape": _KeyConst.K_ESCAPE,
    "Esc": _KeyConst.K_ESCAPE,
    " ": _KeyConst.K_SPACE,
    "Spacebar": _KeyConst.K_SPACE,
    "Delete": _KeyConst.K_DELETE,
    "Home": _KeyConst.K_HOME,
    "End": _KeyConst.K_END,
    "PageUp": _KeyConst.K_PAGEUP,
    "PageDown": _KeyConst.K_PAGEDOWN,
    "Shift": _KeyConst.K_LSHIFT,
    "Control": _KeyConst.K_LCTRL,
    "Alt": _KeyConst.K_LALT,
    "Meta": _KeyConst.K_LMETA,
}

for _ok_i in range(1, 13):
    _KEY_NAME_MAP[f"F{_ok_i}"] = getattr(_KeyConst, f"K_F{_ok_i}")

_KEY_CODE_MAP = {
    "Space": _KeyConst.K_SPACE,
    "Enter": _KeyConst.K_RETURN,
    "NumpadEnter": _KeyConst.K_KP_ENTER,
    "Escape": _KeyConst.K_ESCAPE,
    "ArrowUp": _KeyConst.K_UP,
    "ArrowDown": _KeyConst.K_DOWN,
    "ArrowLeft": _KeyConst.K_LEFT,
    "ArrowRight": _KeyConst.K_RIGHT,
    "ShiftLeft": _KeyConst.K_LSHIFT,
    "ShiftRight": _KeyConst.K_RSHIFT,
    "ControlLeft": _KeyConst.K_LCTRL,
    "ControlRight": _KeyConst.K_RCTRL,
    "AltLeft": _KeyConst.K_LALT,
    "AltRight": _KeyConst.K_RALT,
}

def _ok_key_from_browser_event(event):
    key = str(getattr(event, "key", "") or "")
    code = str(getattr(event, "code", "") or "")
    if code in _KEY_CODE_MAP:
        return _KEY_CODE_MAP[code]
    if key in _KEY_NAME_MAP:
        return _KEY_NAME_MAP[key]
    if code.startswith("Key") and len(code) == 4:
        return ord(code[-1].lower())
    if code.startswith("Digit") and len(code) == 6:
        return ord(code[-1])
    if len(key) == 1:
        return ord(key.lower() if key.isalpha() else key)
    return None

def _ok_unicode_from_browser_event(event):
    key = str(getattr(event, "key", "") or "")
    if len(key) == 1:
        return key
    return ""

def _ok_mods_from_browser_event(event):
    mods = KMOD_NONE
    if bool(getattr(event, "shiftKey", False)):
        mods |= KMOD_SHIFT
    if bool(getattr(event, "ctrlKey", False)):
        mods |= KMOD_CTRL
    if bool(getattr(event, "altKey", False)):
        mods |= KMOD_ALT
    if bool(getattr(event, "metaKey", False)):
        mods |= KMOD_META
    return mods

def _ok_mouse_pos_from_event(canvas, event):
    try:
        rect = canvas.getBoundingClientRect()
        width = max(1, float(rect.width))
        height = max(1, float(rect.height))
        x = int((float(event.clientX) - float(rect.left)) * canvas.width / width)
        y = int((float(event.clientY) - float(rect.top)) * canvas.height / height)
        return (
            max(0, min(int(canvas.width), x)),
            max(0, min(int(canvas.height), y)),
        )
    except Exception:
        return (0, 0)

def _ok_mouse_button_from_event(event):
    button = int(getattr(event, "button", 0))
    if button == 1:
        return 2
    if button == 2:
        return 3
    return 1

def _ok_stop_browser_event(event):
    try:
        event.preventDefault()
    except Exception:
        pass
    try:
        event.stopPropagation()
    except Exception:
        pass

def _ok_bind_input(canvas, runtime):
    _okama_cleanup_input()
    if canvas is None:
        return
    runtime._canvas = canvas
    try:
        canvas.setAttribute("tabindex", "0")
        canvas.style.outline = "none"
    except Exception:
        pass

    def focus_canvas(event=None):
        runtime._focused = True
        try:
            canvas.focus()
        except Exception:
            pass

    def key_down(event):
        key = _ok_key_from_browser_event(event)
        if key is None:
            return
        runtime._focused = True
        runtime._mods = _ok_mods_from_browser_event(event)
        runtime._pressed_keys.add(key)
        runtime.event.post(_Event(
            KEYDOWN,
            key=key,
            mod=runtime._mods,
            unicode=_ok_unicode_from_browser_event(event),
            scancode=0,
            repeat=bool(getattr(event, "repeat", False)),
        ))
        _ok_stop_browser_event(event)

    def key_up(event):
        key = _ok_key_from_browser_event(event)
        if key is None:
            return
        if key not in runtime._pressed_keys and not runtime._focused:
            return
        runtime._mods = _ok_mods_from_browser_event(event)
        runtime._pressed_keys.discard(key)
        runtime.event.post(_Event(
            KEYUP,
            key=key,
            mod=runtime._mods,
            unicode="",
            scancode=0,
        ))
        _ok_stop_browser_event(event)

    def mouse_move(event):
        pos = _ok_mouse_pos_from_event(canvas, event)
        old = runtime._mouse_pos
        rel = (pos[0] - old[0], pos[1] - old[1])
        runtime._mouse_pos = pos
        runtime._mouse_rel = rel
        runtime._focused = True
        runtime.event.post(_Event(
            MOUSEMOTION,
            pos=pos,
            rel=rel,
            buttons=runtime.mouse.get_pressed(),
        ))

    def mouse_down(event):
        focus_canvas(event)
        pos = _ok_mouse_pos_from_event(canvas, event)
        button = _ok_mouse_button_from_event(event)
        runtime._mouse_pos = pos
        runtime._mouse_buttons.add(button)
        runtime.event.post(_Event(MOUSEBUTTONDOWN, pos=pos, button=button))
        _ok_stop_browser_event(event)

    def mouse_up(event):
        pos = _ok_mouse_pos_from_event(canvas, event)
        button = _ok_mouse_button_from_event(event)
        runtime._mouse_pos = pos
        runtime._mouse_buttons.discard(button)
        runtime.event.post(_Event(MOUSEBUTTONUP, pos=pos, button=button))
        _ok_stop_browser_event(event)

    def blur(event=None):
        runtime._focused = False
        runtime._pressed_keys.clear()
        runtime._mouse_buttons.clear()
        runtime._mouse_rel = (0, 0)

    def context_menu(event):
        _ok_stop_browser_event(event)

    _okama_add_listener(canvas, "focus", focus_canvas)
    _okama_add_listener(canvas, "blur", blur)
    _okama_add_listener(canvas, "mousedown", mouse_down)
    _okama_add_listener(canvas, "mousemove", mouse_move)
    _okama_add_listener(canvas, "mouseup", mouse_up)
    _okama_add_listener(canvas, "mouseleave", mouse_up)
    _okama_add_listener(canvas, "keydown", key_down)
    _okama_add_listener(canvas, "keyup", key_up)
    _okama_add_listener(canvas, "contextmenu", context_menu)
    _okama_add_listener(js.window, "keyup", key_up)
    _okama_add_listener(js.window, "blur", blur)

# Create pygame module structure
class PygameModule:
    """Browser-compatible pygame replacement"""
    def __init__(self):
        self._pressed_keys = set()
        self._mods = KMOD_NONE
        self._mouse_pos = (0, 0)
        self._mouse_rel = (0, 0)
        self._mouse_buttons = set()
        self._focused = False
        self._canvas = None
        self.display = _Display()
        self.time = _Time()
        self.key = _Key(self)
        self.mouse = _Mouse(self)
        self.event = _EventModule()
        self.font = _Font()
        self.mixer = _Mixer()
        self.joystick = _Joystick()
        self.draw = _Draw()
        self.Rect = _Rect
        self.Surface = _CanvasSurface
        self.event.Event = _Event
        
        # Copy key constants
        for attr in dir(_KeyConst):
            if attr.startswith('K_'):
                setattr(self, attr, getattr(_KeyConst, attr))
        for attr, value in list(globals().items()):
            if attr.startswith('KMOD_'):
                setattr(self, attr, value)
        
        # Copy event constants
        self.NOEVENT = NOEVENT
        self.QUIT = QUIT
        self.ACTIVEEVENT = ACTIVEEVENT
        self.KEYDOWN = KEYDOWN
        self.KEYUP = KEYUP
        self.MOUSEMOTION = MOUSEMOTION
        self.MOUSEBUTTONUP = MOUSEBUTTONUP
        self.MOUSEBUTTONDOWN = MOUSEBUTTONDOWN
        self.JOYAXISMOTION = JOYAXISMOTION
        self.JOYBALLMOTION = JOYBALLMOTION
        self.JOYHATMOTION = JOYHATMOTION
        self.JOYBUTTONUP = JOYBUTTONUP
        self.JOYBUTTONDOWN = JOYBUTTONDOWN
        self.VIDEORESIZE = VIDEORESIZE
        self.VIDEOEXPOSE = VIDEOEXPOSE
        self.USEREVENT = USEREVENT
        
        # Display flags
        self.SRCALPHA = SRCALPHA
        self.FULLSCREEN = FULLSCREEN
        self.DOUBLEBUF = DOUBLEBUF
        self.HWSURFACE = HWSURFACE
        self.OPENGL = OPENGL
        self.RESIZABLE = RESIZABLE
        self.NOFRAME = NOFRAME
        self.SCALED = SCALED
        
        self._init = False

    def _okama_bind_canvas(self, canvas):
        _ok_bind_input(canvas, self)

    def _okama_reset_preview(self):
        self._pressed_keys.clear()
        self._mods = KMOD_NONE
        self._mouse_rel = (0, 0)
        self._mouse_buttons.clear()
        self.event.clear()
        _okama_cleanup_input()
    
    def init(self):
        if not self._init:
            self.font.init()
            self._init = True
        return (6, 0)  # Version tuple
    
    def quit(self):
        self._init = False
    
    def get_init(self):
        return self._init
    
    def set_mode(self, size, flags=0, depth=0):
        return self.display.set_mode(size, flags, depth)
    
    def get_error(self):
        return ""
    
    def get_warn_level(self):
        return 0

# Install as pygame
import sys
sys.modules['pygame'] = PygameModule()

print("[Okama Studio] Pygame browser stubs loaded")
print("[Okama Studio] Running in preview mode (no real SDL)")
`;

const PYGAME_TEARDOWN_CODE = `
import sys

try:
    pygame_module = sys.modules.get('pygame')
    if pygame_module is not None and hasattr(pygame_module, '_okama_reset_preview'):
        pygame_module._okama_reset_preview()
except Exception:
    pass

try:
    _okama_cleanup_input()
except Exception:
    pass
`;

export default function GamePreview({ code, autoRun = false, onSendToAI }: GamePreviewProps) {
  const previewRootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<RunState>("idle");
  const [output, setOutput] = useState<LogLine[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pyRef = useRef<PyodideInterface | null>(null);
  const stopRequestedRef = useRef(false);
  const gamepadLoopRef = useRef<number | null>(null);
  const prevGamepadButtonsRef = useRef<boolean[][]>([]);
  const prevGamepadAxesRef = useRef<number[][]>([]);

  const startGamepadPolling = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w[GAMEPAD_EVENTS_GLOBAL] = [];
    w[GAMEPAD_STATES_GLOBAL] = [];
    w[GAMEPAD_COUNT_GLOBAL] = 0;
    prevGamepadButtonsRef.current = [];
    prevGamepadAxesRef.current = [];

    const pollLoop = () => {
      const gpList = navigator.getGamepads ? navigator.getGamepads() : [];
      const states: unknown[] = [];
      let count = 0;
      for (let i = 0; i < gpList.length; i++) {
        const gp = gpList[i];
        if (!gp) { states.push(null); continue; }
        count++;
        states.push({
          axes: Array.from(gp.axes),
          buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
        });
        const prevBtns = prevGamepadButtonsRef.current[i] || [];
        const prevAxes = prevGamepadAxesRef.current[i] || [];
        for (let b = 0; b < gp.buttons.length; b++) {
          const now = gp.buttons[b].pressed;
          const was = prevBtns[b] ?? false;
          if (now && !was) w[GAMEPAD_EVENTS_GLOBAL].push({ type: "JOYBUTTONDOWN", joy: i, button: b });
          else if (!now && was) w[GAMEPAD_EVENTS_GLOBAL].push({ type: "JOYBUTTONUP", joy: i, button: b });
        }
        for (let a = 0; a < gp.axes.length; a++) {
          const now = gp.axes[a];
          const was = prevAxes[a] ?? 0;
          if (Math.abs(now - was) > 0.01)
            w[GAMEPAD_EVENTS_GLOBAL].push({ type: "JOYAXISMOTION", joy: i, axis: a, value: now });
        }
        prevGamepadButtonsRef.current[i] = gp.buttons.map((b) => b.pressed);
        prevGamepadAxesRef.current[i] = Array.from(gp.axes);
      }
      w[GAMEPAD_STATES_GLOBAL] = states;
      w[GAMEPAD_COUNT_GLOBAL] = count;
      gamepadLoopRef.current = requestAnimationFrame(pollLoop);
    };
    gamepadLoopRef.current = requestAnimationFrame(pollLoop);
  }, []);

  const stopGamepadPolling = useCallback(() => {
    if (gamepadLoopRef.current !== null) {
      cancelAnimationFrame(gamepadLoopRef.current);
      gamepadLoopRef.current = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w[GAMEPAD_EVENTS_GLOBAL] = [];
    w[GAMEPAD_STATES_GLOBAL] = [];
    w[GAMEPAD_COUNT_GLOBAL] = 0;
    prevGamepadButtonsRef.current = [];
    prevGamepadAxesRef.current = [];
  }, []);

  const appendOutput = (line: string, isError = false) =>
    setOutput((prev) => [...prev.slice(-100), { text: line, isError }]);

  const run = useCallback(async () => {
    if (!code.trim()) return;
    stopRequestedRef.current = false;
    setState("loading");
    setOutput([]);
    setError("");
    const runtimeErrors: string[] = [];
    let stoppedByRequest = false;

    try {
      setProgress("Loading Pyodide runtime…");
      if (!pyRef.current) {
        pyRef.current = await getPyodide();
      }
      const py = pyRef.current;

      // Create a JS callback to capture logs
      const logCallback = (text: string) => {
        appendOutput(text, false);
      };
      const errCallback = (text: string) => {
        runtimeErrors.push(text);
        appendOutput(text, true);
      };
      
      // Expose to Python via globalThis (required for Pyodide >= 0.21).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winAny = window as any;
      winAny[PREVIEW_LOG_CALLBACK] = logCallback;
      winAny[PREVIEW_ERROR_CALLBACK] = errCallback;
      winAny[PREVIEW_STOP_CALLBACK] = () => stopRequestedRef.current;

      // Set up stdout capture with JS callback
      setProgress("Setting up stdout…");
      py.runPython(STDIO_SETUP_CODE);

      try {
        // Install pygame browser stubs
        setProgress("Loading pygame browser stubs…");
        py.runPython(PYGAME_SETUP_CODE);

        // Transform user code: wrap in async def + inject await asyncio.sleep(0)
        // in every while-loop body so the JS event loop stays responsive.
        setProgress("Preparing game loop…");
        py.runPython(`_okama_raw_src = ${JSON.stringify(code)}`);
        py.runPython(CODE_TRANSFORM_CODE);
        const transformedCode = (py.globals.get('_okama_transformed_src') as string) || code;

        setProgress("Running your game…");
        setState("running");
        setProgress("");
        startGamepadPolling();
        window.setTimeout(() => canvasRef.current?.focus(), 0);

        // Now run the transformed (async-yielding) user code
        try {
          await py.runPythonAsync(transformedCode);
        } catch (runErr) {
          const errMsg = String(runErr);
          if (stopRequestedRef.current || errMsg.includes("OkamaPreviewStopped")) {
            stoppedByRequest = true;
            appendOutput("[Okama Studio] Preview stopped", false);
          } else {
            // Python runtime errors
            runtimeErrors.push(errMsg);
            appendOutput(`[Runtime Error] ${errMsg}`, true);
            throw runErr;
          }
        }
      } finally {
        stopGamepadPolling();
        try {
          py.runPython(PYGAME_TEARDOWN_CODE);
        } catch {
          // Input cleanup should not mask the actual preview result.
        }
        try {
          py.runPython(STDIO_TEARDOWN_CODE);
        } catch {
          // Keep the UI error focused on the preview failure, not teardown.
        }
        delete winAny[PREVIEW_LOG_CALLBACK];
        delete winAny[PREVIEW_ERROR_CALLBACK];
        delete winAny[PREVIEW_STOP_CALLBACK];
      }

      // Collect any runtime errors that were printed
      if (!stoppedByRequest && runtimeErrors.length > 0) {
        setError(runtimeErrors.join("\n"));
      }

      setState("stopped");
      stopRequestedRef.current = false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (stopRequestedRef.current || msg.includes("OkamaPreviewStopped")) {
        setState("stopped");
        stopRequestedRef.current = false;
        appendOutput("[Okama Studio] Preview stopped", false);
        return;
      }
      const detailLines = runtimeErrors.length > 0 ? [...runtimeErrors] : [];
      if (!detailLines.includes(msg)) {
        detailLines.push(msg);
      }
      setError(detailLines.join("\n"));
      setState("error");
      appendOutput(`[Error] ${msg}`, true);
      stopRequestedRef.current = false;
    }
  }, [code, startGamepadPolling, stopGamepadPolling]);

  const stop = useCallback(() => {
    stopRequestedRef.current = true;
    setState((current) => current === "running" ? "stopping" : current);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const root = previewRootRef.current;
    if (!root) return;

    if (isFullscreen) {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      return;
    }

    setIsFullscreen(true);
    if (root.requestFullscreen) {
      await root.requestFullscreen().catch(() => undefined);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (autoRun) run();
  }, [autoRun, run]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === previewRootRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)[PREVIEW_STOP_CALLBACK] = () => true;
    };
  }, []);

  return (
    <div
      ref={previewRootRef}
      className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
      style={{
        background: "#10120f",
        width: isFullscreen ? "100vw" : undefined,
        height: isFullscreen ? "100vh" : undefined,
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(243,239,228,0.08)", background: "#181a16" }}
      >
        <Monitor size={14} style={{ color: "#c9c3b3" }} />
        <span className="text-xs font-semibold" style={{ color: "#c9c3b3" }}>
          Preview
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono ml-1"
          style={{ background: "rgba(83,217,230,0.10)", color: "#53d9e6" }}
        >
          Pyodide
        </span>
        <div className="flex-1" />
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded transition-colors"
          style={{ color: isFullscreen ? "#8df77f" : "#c9c3b3", background: isFullscreen ? "rgba(141,247,127,0.08)" : "transparent" }}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
          aria-label={isFullscreen ? "Exit fullscreen preview" : "Open fullscreen preview"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={run}
          disabled={state === "loading" || state === "running" || state === "stopping"}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors"
          style={{
            background: state === "running" || state === "stopping" ? "rgba(141,247,127,0.08)" : "#8df77f",
            color: state === "running" || state === "stopping" ? "#8df77f" : "#10120f",
            opacity: state === "loading" ? 0.6 : 1,
            cursor: state === "loading" || state === "running" || state === "stopping" ? "not-allowed" : "pointer",
          }}
        >
          {state === "loading" ? (
            <><Loader2 size={12} className="animate-spin" /> Loading…</>
          ) : state === "stopping" ? (
            <><Loader2 size={12} className="animate-spin" /> Stopping…</>
          ) : state === "running" ? (
            <><Play size={12} fill="currentColor" /> Running</>
          ) : (
            <><Play size={12} fill="currentColor" /> Run</>
          )}
        </button>
        {(state === "running" || state === "stopping") && (
          <button
            onClick={stop}
            disabled={state === "stopping"}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-colors"
            style={{
              background: "rgba(242,109,91,0.15)",
              color: "#f26d5b",
              opacity: state === "stopping" ? 0.7 : 1,
              cursor: state === "stopping" ? "not-allowed" : "pointer",
            }}
          >
            <Square size={12} fill="currentColor" /> {state === "stopping" ? "Stopping" : "Stop"}
          </button>
        )}
        <button
          onClick={() => { setOutput([]); setError(""); setState("idle"); }}
          className="p-1 rounded transition-colors"
          style={{ color: "#c9c3b3" }}
          title="Clear"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Game canvas */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden"
          style={{ background: "#0d0f0c", minHeight: 0 }}
        >
          {state === "idle" && (
            <div className="text-center p-6">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
                style={{ background: "rgba(141,247,127,0.08)" }}
              >
                <Play size={28} style={{ color: "#8df77f" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#c9c3b3" }}>
                Click Run to preview your game
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b7464" }}>
                Powered by Pyodide — runs Python in your browser
              </p>
            </div>
          )}
          {state === "loading" && (
            <div className="text-center p-6">
              <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "#8df77f" }} />
              <p className="text-sm font-semibold" style={{ color: "#c9c3b3" }}>{progress}</p>
              <p className="text-xs mt-1" style={{ color: "#6b7464" }}>First load may take 10–30s</p>
            </div>
          )}
          {state === "error" && (
            <div className="text-center p-6 max-w-sm">
              <AlertCircle size={28} className="mx-auto mb-3" style={{ color: "#f26d5b" }} />
              <p className="text-sm font-bold mb-2" style={{ color: "#f26d5b" }}>Error</p>
              <pre className="text-xs text-left overflow-auto max-h-32 p-2 rounded" style={{ background: "#181a16", color: "#f3efe4" }}>
                {error}
              </pre>
            </div>
          )}
          <canvas
            id={PREVIEW_CANVAS_ID}
            ref={canvasRef}
            tabIndex={0}
            onMouseDown={() => canvasRef.current?.focus()}
            className="max-w-full max-h-full"
            style={{
              display: state === "running" || state === "stopping" || state === "stopped" ? "block" : "none",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              imageRendering: "pixelated",
            }}
          />
        </div>

        {/* Console output */}
        {output.length > 0 && (
          <div
            className="border-t shrink-0 overflow-y-auto max-h-40"
            style={{ borderColor: "rgba(243,239,228,0.08)", background: "#10120f" }}
          >
            <div
              className="px-3 py-1.5 flex items-center justify-between border-b sticky top-0 z-10"
              style={{ borderColor: "rgba(243,239,228,0.06)", background: "#181a16" }}
            >
              <div className="flex items-center gap-2">
                <Terminal size={12} style={{ color: "#c9c3b3" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9c3b3" }}>
                  Console
                </span>
                {error && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{ background: "rgba(242,109,91,0.15)", color: "#f26d5b" }}
                  >
                    <XCircle size={10} className="inline mr-1" />
                    Error
                  </span>
                )}
              </div>
              {error && onSendToAI && (
                <button
                  onClick={() => onSendToAI(error)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition-colors"
                  style={{ background: "#8df77f", color: "#10120f" }}
                >
                  <Wand2 size={10} /> AI Fix
                </button>
              )}
            </div>
            {output.map((line, i) => (
              <pre
                key={i}
                className="px-3 py-0.5 text-xs font-mono"
                style={{
                  color: line.isError ? "#f26d5b" : "#8df77f",
                  background: line.isError ? "rgba(242,109,91,0.05)" : "transparent",
                }}
              >
                {line.text}
              </pre>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
