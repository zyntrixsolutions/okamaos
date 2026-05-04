"""SSL helper for OkamaOS - ensures CA certificates are available for HTTPS requests."""

import os
import ssl
import urllib.request
from typing import Optional

# Common CA certificate paths in order of preference
_CA_CERT_PATHS = [
    "/etc/ssl/certs/ca-certificates.crt",  # Buildroot/ca-certificates
    "/etc/ssl/cert.pem",
    "/etc/ssl/certs",
    "/usr/lib/ssl/certs",
]


def get_ca_certs_path() -> Optional[str]:
    """Return the first available CA certificates bundle or directory."""
    for path in _CA_CERT_PATHS:
        if os.path.isfile(path) or os.path.isdir(path):
            return path
    return None


def create_ssl_context() -> ssl.SSLContext:
    """Create an SSL context with system CA certificates.
    
    Falls back to default context if system certs are not available.
    """
    ca_path = get_ca_certs_path()
    
    if ca_path and os.path.isfile(ca_path):
        # Use specific CA bundle
        context = ssl.create_default_context(cafile=ca_path)
    elif ca_path and os.path.isdir(ca_path):
        # Use CA directory
        context = ssl.create_default_context(capath=ca_path)
    else:
        # Fallback to default - will use bundled certs if available
        context = ssl.create_default_context()
    
    return context


def urlopen_with_ssl(url, *args, **kwargs):
    """urllib.request.urlopen with proper SSL context.
    
    This ensures HTTPS requests work even when Python can't find CA certs.
    """
    if 'context' not in kwargs:
        kwargs['context'] = create_ssl_context()
    return urllib.request.urlopen(url, *args, **kwargs)
