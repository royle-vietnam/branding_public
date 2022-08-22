/** @odoo-module **/

import {WebClient} from "@web/webclient/webclient";
import {patch} from "web.utils";

patch(WebClient.prototype, "viin_brand_common.WebClient",  {
    setup() {
		this._super();
        this.title.setParts({ zopenerp: "Viindoo" });
	}
});
