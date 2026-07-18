/** @odoo-module **/

import { NavBar } from "@web/webclient/navbar/navbar";
import { useBus } from "@web/core/utils/hooks";
import { patch } from "@web/core/utils/patch";
import { useRef } from "@odoo/owl";

patch(NavBar.prototype, {
    setup() {
        super.setup();
        // Read apps_menu optionally: the NavBar is mounted by isolated core
        // component tests that do not start this service, and useService() would
        // throw and break them as soon as web_responsive is installed.
        this.appsMenuService = this.env.services.apps_menu;
        this.homeMenuButton = useRef("homeMenuButton");
        useBus(this.env.bus, "TOGGLE_HOME_MENU_BUTTON", ({detail: toggle}) => {
            this.homeMenuButton.el.classList.toggle('d-none', toggle);
        });
    },
});
