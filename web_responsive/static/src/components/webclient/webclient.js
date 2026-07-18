/** @odoo-module **/

import { WebClient } from "@web/webclient/webclient";
import { patch } from "@web/core/utils/patch";
import { session } from "@web/session";


// Patch WebClient to show AppsMenu instead of default app
patch(WebClient.prototype, {
    setup() {
        super.setup();
        // Read apps_menu optionally so isolated core WebClient tests (which do
        // not start this service) keep working once web_responsive is installed.
        this.appsMenuService = this.env.services.apps_menu;
    },
    _loadDefaultApp() {
        // The preference travels on session_info (see models/ir_http.py), so no
        // per-boot RPC is needed and the optional chain stays falsy - never
        // throwing - in isolated core tests that ship no session.apps_menu.
        if (this.appsMenuService && session.apps_menu?.is_redirect_home) {
            return this.appsMenuService.toggleMenu(true);
        }
        return super._loadDefaultApp();
    },
});
