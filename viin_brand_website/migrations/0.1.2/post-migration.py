from odoo import SUPERUSER_ID, api

from odoo.addons.viin_brand_website import _brand_untouched_favicons


def migrate(cr, version):
    """Correct favicons on databases where this module was ALREADY installed.

    `post_init_hook` only fires on install, so it never reaches an existing
    deployment being updated. Those are exactly the databases at risk: before
    this version the module's QWeb `x_icon` override forced the brand path at
    render time, so a website still holding core's stock favicon nonetheless
    LOOKED branded. Dropping that override (it destroyed website's own producer,
    making a configured favicon unservable) makes the stored value render - and
    for those websites it is Odoo's icon.

    Same discipline as the hook: only records byte-identical to core's default
    are rewritten; a favicon anybody configured is left exactly as it is.
    """
    if not version:
        return
    env = api.Environment(cr, SUPERUSER_ID, {})
    _brand_untouched_favicons(env)
