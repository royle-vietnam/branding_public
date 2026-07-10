/** @odoo-module **/

import { WebClient } from "@web/webclient/webclient";
import { patch } from "@web/core/utils/patch";

// Patch WebClient to show AppsMenu instead of default app
patch(WebClient.prototype, {
    setup() {
        super.setup();
        // Read apps_menu optionally so isolated core WebClient tests (which do
        // not start this service) keep working once web_responsive is installed.
        this.appsMenuService = this.env.services.apps_menu;
    },
    _loadDefaultApp() {
        if (this.appsMenuService) {
            return this.appsMenuService.toggleMenu(true);
        }
        return super._loadDefaultApp();
    },
});
