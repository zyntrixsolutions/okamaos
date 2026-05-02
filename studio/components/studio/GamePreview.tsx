'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Square, RotateCcw, AlertCircle, Loader2, Monitor, Terminal, Wand2, XCircle, AlertTriangle } from "lucide-react";

interface GamePreviewProps {
  code: string;
  autoRun?: boolean;
  onSendToAI?: (errorText: string) => void;
}

type RunState = "idle" | "loading" | "running" | "error" | "stopped";

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

# --- Pygame Browser Stubs ---
class _CanvasSurface:
    """A pygame.Surface replacement that renders to HTML Canvas"""
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self._canvas = None
        self._ctx = None
        self._init_canvas()
    
    def _init_canvas(self):
        # Find the canvas from the parent window
        try:
            doc = js.document
            canvases = doc.getElementsByTagName('canvas')
            if canvases.length > 0:
                self._canvas = canvases.item(0)
                self._canvas.width = self.width
                self._canvas.height = self.height
                self._ctx = self._canvas.getContext("2d")
        except:
            pass
    
    def fill(self, color):
        if self._ctx:
            if len(color) >= 3:
                r, g, b = color[0], color[1], color[2]
                self._ctx.fillStyle = f"rgb({r},{g},{b})"
            self._ctx.fillRect(0, 0, self.width, self.height)
    
    def blit(self, source, dest, area=None):
        # Basic blit - for now just pass through
        pass
    
    def get_rect(self):
        return _Rect(0, 0, self.width, self.height)
    
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
    def __init__(self, x, y, w, h):
        self.x = int(x)
        self.y = int(y)
        self.width = int(w)
        self.height = int(h)
        self.left = self.x
        self.top = self.y
        self.right = self.x + self.width
        self.bottom = self.y + self.height
        self.centerx = self.x + self.width // 2
        self.centery = self.y + self.height // 2
        self.topleft = (self.x, self.y)
        self.topright = (self.right, self.y)
        self.bottomleft = (self.x, self.bottom)
        self.bottomright = (self.right, self.bottom)
        self.center = (self.centerx, self.centery)
        self.midleft = (self.x, self.centery)
        self.midright = (self.right, self.centery)
        self.midtop = (self.centerx, self.y)
        self.midbottom = (self.centerx, self.bottom)
        self.size = (self.width, self.height)
    
    def copy(self):
        return _Rect(self.x, self.y, self.width, self.height)
    
    def move(self, x, y):
        return _Rect(self.x + x, self.y + y, self.width, self.height)
    
    def move_ip(self, x, y):
        self.x += x
        self.y += y
        self._update()
    
    def _update(self):
        self.left = self.x
        self.top = self.y
        self.right = self.x + self.width
        self.bottom = self.y + self.height
        self.centerx = self.x + self.width // 2
        self.centery = self.y + self.height // 2
        self.topleft = (self.x, self.y)
        self.topright = (self.right, self.y)
        self.bottomleft = (self.x, self.bottom)
        self.bottomright = (self.right, self.bottom)
        self.center = (self.centerx, self.centery)
        self.midleft = (self.x, self.centery)
        self.midright = (self.right, self.centery)
        self.midtop = (self.centerx, self.y)
        self.midbottom = (self.centerx, self.bottom)
        self.size = (self.width, self.height)
    
    def inflate(self, x, y):
        return _Rect(self.x - x//2, self.y - y//2, self.width + x, self.height + y)
    
    def inflate_ip(self, x, y):
        self.x -= x//2
        self.y -= y//2
        self.width += x
        self.height += y
        self._update()
    
    def clamp(self, rect):
        return self
    
    def clamp_ip(self, rect):
        pass
    
    def clip(self, rect):
        return _Rect(self.x, self.y, self.width, self.height)
    
    def union(self, rect):
        return _Rect(self.x, self.y, self.width, self.height)
    
    def union_ip(self, rect):
        pass
    
    def contains(self, rect):
        return (self.left <= rect.left and self.right >= rect.right and
                self.top <= rect.top and self.bottom >= rect.bottom)
    
    def collidepoint(self, x, y):
        return self.left <= x < self.right and self.top <= y < self.bottom
    
    def colliderect(self, rect):
        return (self.left < rect.right and self.right > rect.left and
                self.top < rect.bottom and self.bottom > rect.top)

class _Event:
    def __init__(self, type, **kwargs):
        self.type = type
        self.__dict__.update(kwargs)

class _Display:
    """pygame.display replacement"""
    def __init__(self):
        self._surface = None
        self._w = 800
        self._h = 500
        self._init = False
    
    def set_mode(self, size, flags=0, depth=0):
        self._w, self._h = size if size[0] > 0 else (800, 500)
        self._surface = _CanvasSurface(self._w, self._h)
        self._surface.fill((16, 18, 15))
        self._init = True
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
            if framerate > 0:
                target = 1.0 / framerate
                if elapsed < target:
                    self._time.sleep(target - elapsed)
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

class _Key:
    """pygame.key replacement"""
    def get_pressed(self):
        # Return key states from browser
        keys = {}
        try:
            # Try to get from js window if available
            pass
        except:
            pass
        return keys
    
    def get_mods(self):
        return 0
    
    def set_mods(self, mods):
        pass
    
    def set_repeat(self, delay=0, interval=0):
        pass
    
    def get_repeat(self):
        return (0, 0)
    
    def name(self, key):
        return str(key)

class _Mouse:
    """pygame.mouse replacement"""
    def get_pos(self):
        return (0, 0)
    
    def get_rel(self):
        return (0, 0)
    
    def get_pressed(self):
        return (0, 0, 0)
    
    def set_pos(self, pos):
        pass
    
    def set_visible(self, visible):
        pass
    
    def get_visible(self):
        return True
    
    def get_focused(self):
        return False
    
    def set_cursor(self, *args):
        pass
    
    def get_cursor(self):
        return None

class _EventModule:
    """pygame.event replacement"""
    def __init__(self):
        self._queue = []
    
    def get(self, eventtype=None):
        events = self._queue[:]
        self._queue = []
        return events
    
    def poll(self):
        if self._queue:
            return self._queue.pop(0)
        return _Event(0)  # NOEVENT
    
    def wait(self):
        return _Event(0)
    
    def peek(self, eventtype=None):
        return bool(self._queue)
    
    def clear(self, eventtype=None):
        self._queue = []
    
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
        self.size = size
        self.bold = bold
        self.italic = italic
    
    def render(self, text, antialias, color, background=None):
        # Create a simple surface with text
        surf = _CanvasSurface(len(text) * self.size // 2, self.size + 4)
        return surf
    
    def size(self, text):
        return (len(text) * self.size // 2, self.size + 4)
    
    def set_underline(self, underline):
        pass
    
    def get_underline(self):
        return False
    
    def set_bold(self, bold):
        pass
    
    def get_bold(self):
        return self.bold
    
    def set_italic(self, italic):
        pass
    
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

class _Joystick:
    """pygame.joystick replacement - stub"""
    def init(self):
        pass
    
    def quit(self):
        pass
    
    def get_init(self):
        return False
    
    def get_count(self):
        return 0
    
    def Joystick(self, id):
        return None

class _Draw:
    """pygame.draw replacement"""
    def rect(self, surface, color, rect, width=0, border_radius=0):
        if surface._ctx:
            r, g, b = color[0], color[1], color[2]
            if len(color) > 3:
                a = color[3]
                surface._ctx.fillStyle = f"rgba({r},{g},{b},{a/255})"
            else:
                surface._ctx.fillStyle = f"rgb({r},{g},{b})"
            
            if isinstance(rect, _Rect):
                x, y, w, h = rect.x, rect.y, rect.width, rect.height
            else:
                x, y, w, h = rect
            
            if width == 0:
                surface._ctx.fillRect(x, y, w, h)
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeRect(x, y, w, h)
    
    def circle(self, surface, color, center, radius, width=0):
        if surface._ctx:
            r, g, b = color[0], color[1], color[2]
            surface._ctx.beginPath()
            surface._ctx.arc(center[0], center[1], radius, 0, 2 * math.pi)
            if width == 0:
                surface._ctx.fillStyle = f"rgb({r},{g},{b})"
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = f"rgb({r},{g},{b})"
                surface._ctx.stroke()
    
    def line(self, surface, color, start_pos, end_pos, width=1):
        if surface._ctx:
            r, g, b = color[0], color[1], color[2]
            surface._ctx.beginPath()
            surface._ctx.moveTo(start_pos[0], start_pos[1])
            surface._ctx.lineTo(end_pos[0], end_pos[1])
            surface._ctx.lineWidth = width
            surface._ctx.strokeStyle = f"rgb({r},{g},{b})"
            surface._ctx.stroke()
    
    def lines(self, surface, color, closed, pointlist, width=1):
        if surface._ctx and len(pointlist) > 1:
            r, g, b = color[0], color[1], color[2]
            surface._ctx.beginPath()
            surface._ctx.moveTo(pointlist[0][0], pointlist[0][1])
            for p in pointlist[1:]:
                surface._ctx.lineTo(p[0], p[1])
            if closed:
                surface._ctx.closePath()
            surface._ctx.lineWidth = width
            surface._ctx.strokeStyle = f"rgb({r},{g},{b})"
            surface._ctx.stroke()
    
    def polygon(self, surface, color, pointlist, width=0):
        if surface._ctx and len(pointlist) > 2:
            r, g, b = color[0], color[1], color[2]
            surface._ctx.beginPath()
            surface._ctx.moveTo(pointlist[0][0], pointlist[0][1])
            for p in pointlist[1:]:
                surface._ctx.lineTo(p[0], p[1])
            surface._ctx.closePath()
            if width == 0:
                surface._ctx.fillStyle = f"rgb({r},{g},{b})"
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = f"rgb({r},{g},{b})"
                surface._ctx.stroke()
    
    def ellipse(self, surface, color, rect, width=0):
        if surface._ctx:
            r, g, b = color[0], color[1], color[2]
            if isinstance(rect, _Rect):
                x, y, w, h = rect.x, rect.y, rect.width, rect.height
            else:
                x, y, w, h = rect
            surface._ctx.beginPath()
            surface._ctx.ellipse(x + w//2, y + h//2, w//2, h//2, 0, 0, 2 * math.pi)
            if width == 0:
                surface._ctx.fillStyle = f"rgb({r},{g},{b})"
                surface._ctx.fill()
            else:
                surface._ctx.lineWidth = width
                surface._ctx.strokeStyle = f"rgb({r},{g},{b})"
                surface._ctx.stroke()
    
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

# Event type constants
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
FULLSCREEN = 0x80000000
DOUBLEBUF = 0x40000000
HWSURFACE = 0x10000000
OPENGL = 0x00000002
RESIZABLE = 0x00000010
NOFRAME = 0x00000020
SCALED = 0x00004000

# Create pygame module structure
class PygameModule:
    """Browser-compatible pygame replacement"""
    def __init__(self):
        self.display = _Display()
        self.time = _Time()
        self.key = _Key()
        self.mouse = _Mouse()
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
        
        # Copy event constants
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
        self.FULLSCREEN = FULLSCREEN
        self.DOUBLEBUF = DOUBLEBUF
        self.HWSURFACE = HWSURFACE
        self.OPENGL = OPENGL
        self.RESIZABLE = RESIZABLE
        self.NOFRAME = NOFRAME
        self.SCALED = SCALED
        
        self._init = False
    
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

export default function GamePreview({ code, autoRun = false, onSendToAI }: GamePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasId = "okama-preview-canvas";
  const [state, setState] = useState<RunState>("idle");
  const [output, setOutput] = useState<LogLine[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState("");
  const pyRef = useRef<PyodideInterface | null>(null);

  const appendOutput = (line: string, isError = false) =>
    setOutput((prev) => [...prev.slice(-100), { text: line, isError }]);

  const run = useCallback(async () => {
    if (!code.trim()) return;
    setState("loading");
    setOutput([]);
    setError("");
    const runtimeErrors: string[] = [];

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
      
      // Expose to Python
      (window as unknown as Record<string, unknown>).__okama_log = logCallback;
      (window as unknown as Record<string, unknown>).__okama_err = errCallback;

      // Set up stdout capture with JS callback
      setProgress("Setting up stdout…");
      py.runPython(`
import sys
from pyodide.ffi import create_proxy
import js

class _StdOut:
    def __init__(self, is_err=False):
        self.is_err = is_err
        self.buffer = ""
    def write(self, s):
        self.buffer += s
        lines = self.buffer.split('\n')
        self.buffer = lines.pop()  # Keep incomplete line
        for line in lines:
            if line:
                if self.is_err:
                    js.__okama_err(line)
                else:
                    js.__okama_log(line)
    def flush(self):
        if self.buffer:
            if self.is_err:
                js.__okama_err(self.buffer)
            else:
                js.__okama_log(self.buffer)
            self.buffer = ""

sys.stdout = _StdOut(False)
sys.stderr = _StdOut(True)
`);

      // Install pygame browser stubs
      setProgress("Loading pygame browser stubs…");
      py.runPython(PYGAME_SETUP_CODE);
      
      setProgress("Running your game…");
      setState("running");
      setProgress("");

      // Now run the user code - pygame is already available
      try {
        await py.runPythonAsync(code);
      } catch (runErr) {
        // Python runtime errors
        const errMsg = String(runErr);
        runtimeErrors.push(errMsg);
        appendOutput(`[Runtime Error] ${errMsg}`, true);
        throw runErr;
      }

      // Collect any runtime errors that were printed
      if (runtimeErrors.length > 0) {
        setError(runtimeErrors.join("\n"));
      }

      setState("stopped");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setState("error");
      appendOutput(`[Error] ${msg}`, true);
    }
  }, [code]);

  const stop = () => setState("stopped");

  useEffect(() => {
    if (autoRun) run();
  }, [autoRun, run]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "#10120f" }}
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
          onClick={run}
          disabled={state === "loading" || state === "running"}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors"
          style={{
            background: state === "running" ? "rgba(141,247,127,0.08)" : "#8df77f",
            color: state === "running" ? "#8df77f" : "#10120f",
            opacity: state === "loading" ? 0.6 : 1,
            cursor: state === "loading" || state === "running" ? "not-allowed" : "pointer",
          }}
        >
          {state === "loading" ? (
            <><Loader2 size={12} className="animate-spin" /> Loading…</>
          ) : state === "running" ? (
            <><Play size={12} fill="currentColor" /> Running</>
          ) : (
            <><Play size={12} fill="currentColor" /> Run</>
          )}
        </button>
        {state === "running" && (
          <button
            onClick={stop}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-colors"
            style={{ background: "rgba(242,109,91,0.15)", color: "#f26d5b" }}
          >
            <Square size={12} fill="currentColor" /> Stop
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
            id={canvasId}
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ display: state === "running" || state === "stopped" ? "block" : "none" }}
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
