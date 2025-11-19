import wrapt

from superset import results_backend
from flask import g


@wrapt.decorator
def add_username_to_results_backend(wrapped, instance, args, kwargs):
    set_function = results_backend.set
    get_function = results_backend.get

    def set_with_username(key, value, timeout=None, **kwargs):
        username = g.user.username.lower() if g.user else None
        return set_function(key, value, timeout=timeout, username=username, **kwargs)

    def get_with_username(key, timeout=None, **kwargs):
        username = g.user.username.lower() if g.user else None
        return get_function(key, timeout=timeout, username=username, **kwargs)

    # results_backend.set = set_with_username
    # results_backend.get = get_with_username

    return wrapped(*args, **kwargs)
