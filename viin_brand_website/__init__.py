import base64
import logging

from odoo import tools

from . import models

_logger = logging.getLogger(__name__)

CORE_FAVICON_PATH = 'web/static/img/favicon.ico'


def _brand_untouched_favicons(env):
    """Give the Viindoo favicon to websites still carrying core's stock one.

    A field default only fires when a record is CREATED, so models/website.py's
    default never reaches two populations: `website.default_website`, which core
    creates while loading the `website` module - before this module's field
    extension exists at all - and any website that predates this module's
    install.

    Until this module dropped the QWeb `x_icon` override those records still
    LOOKED branded, because the override forced the brand path at render time
    for every website regardless of what the field held. With that override
    correctly gone (it destroyed website's own producer, so a configured favicon
    could never be served), the stored value is what renders - and for those
    records it is still Odoo's icon. So it has to be corrected once, here.

    ONLY records whose favicon is byte-identical to core's own default are
    touched. Anything else is a value somebody chose, and overwriting it would
    be the exact regression that removing the override was meant to fix.
    """
    Website = env['website'].sudo()
    websites = Website.search([])
    if not websites:
        return

    try:
        with tools.file_open(CORE_FAVICON_PATH, 'rb') as f:
            core_default = base64.b64encode(f.read())
    except (FileNotFoundError, OSError):
        # Cannot tell "untouched" from "configured" without the reference value.
        # Doing nothing leaves an unbranded icon; guessing could destroy a real one.
        _logger.warning(
            "%s not readable; leaving every website favicon untouched.", CORE_FAVICON_PATH
        )
        return

    brand_favicon = Website._default_brand_favicon()
    if brand_favicon == core_default:
        # The brand asset is missing, so _default_brand_favicon fell back to
        # core's default - rewriting would change nothing.
        return

    untouched = websites.filtered(lambda w: w.favicon == core_default)
    if not untouched:
        return

    # write() routes through website._handle_favicon, which re-encodes to a
    # normalised ICO. That is fine and makes this idempotent: afterwards the
    # value no longer equals core's default, so a second run selects nothing.
    untouched.write({'favicon': brand_favicon})
    _logger.info(
        "Branded the favicon of %d website(s) that still carried Odoo's default.",
        len(untouched),
    )


def post_init_hook(env):
    _brand_untouched_favicons(env)
