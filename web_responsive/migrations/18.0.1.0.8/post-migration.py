# Copyright 2026 Viindoo
# License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl.html).

from odoo import SUPERUSER_ID, api


def migrate(cr, version):
    """Preserve today's login landing for users that predate the restored feature.

    Until this version `is_redirect_home` was dead code: an unconditional
    `return` in webclient.js opened the Apps menu for *everybody*, so every
    existing user is stored `False` while actually experiencing "Apps menu after
    login". Restoring the branch without this backfill would silently move 100%
    of existing users onto Odoo's stock landing - a UX change this forward-port
    never advertised, and one only an admin could undo, one user at a time.

    Users who configured a Home Action (`action_id`) are deliberately skipped and
    keep `False`, so their action is finally honoured - exactly what
    `_compute_redirect_home`'s clamp documents. Newly created users are untouched
    by definition (a migration writes existing rows only), so they keep
    upstream's deliberate opt-in default of `False`.
    """
    if not version:
        return
    env = api.Environment(cr, SUPERUSER_ID, {})
    # active_test=False: archived users must be backfilled too. Skipping them
    # would silently drop them onto the stock landing if they are reactivated
    # later - the same invisible UX change this script exists to prevent.
    users = (
        env["res.users"]
        .with_context(active_test=False)
        .search([("action_id", "=", False), ("is_redirect_home", "=", False)])
    )
    # Re-run safe: the is_redirect_home filter makes a second pass match nothing,
    # so a user who has since opted out is never silently re-opted-in.
    # No cr.commit(): the upgrade driver owns the transaction boundary.
    if users:
        users.is_redirect_home = True
