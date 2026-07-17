/** @odoo-module **/

import { Navbar } from "@point_of_sale/app/navbar/navbar";
import { patch } from "@web/core/utils/patch";

patch(Navbar.prototype, {
    /**
     * @override
     */
    setup() {
        super.setup();
        // copy from to_base
        // The company service may be absent in a bare test env that does not
        // register it, so guard the read: without a current company there is no
        // branded favicon to set - just skip. Real POS always has one.
        const currentCompany = this.env.services.company?.currentCompany;
        if (!currentCompany) {
            return;
        }
        const favicon = `/web/image/res.company/${currentCompany.id}/favicon`;
        const icons = document.querySelectorAll("link[rel*='icon']");
        for (const icon of icons) {
            if (icon.rel != "apple-touch-icon") {
                icon.href = favicon;
            }
        }
    },
});
