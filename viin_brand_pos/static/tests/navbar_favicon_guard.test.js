/** @odoo-module **/

import { describe, expect, getFixture, test } from "@odoo/hoot";

// Resolves to the mock in mock_navbar_module.js (registered under this exact module name), not
// the real point_of_sale Navbar - see that file for why. The side-effect import below applies
// the REAL, unmodified viin_brand_pos patch on top of the mock's prototype, exactly as it applies
// to the real class in production.
import { Navbar } from "@point_of_sale/app/navbar/navbar";
import "@viin_brand_pos/app/navbar/navbar";

describe.current.tags("headless");

// viin_brand_pos/static/src/app/navbar/navbar.js patches Navbar.prototype.setup() to set a
// branded favicon from the current company, guarded by:
//     const currentCompany = this.env.services.company?.currentCompany;
//     if (!currentCompany) { return; }
// Business rule under protection: that guard must make setup() bail out SAFELY (no throw) when
// the `company` service (or its currentCompany) is not available - not crash the whole POS UI.
// Without the guard, reading `currentCompany.id` throws a TypeError the moment the company
// service (or its currentCompany) is missing.
//
// Grounding (18.0, OSM + live 18.0 instance):
// - js_test_inspect(module='point_of_sale', odoo_version='18.0') lists only 4 Hoot suites in
//   point_of_sale (data_service/lna/related_models/render_service.test.js) and NONE mounts an OWL
//   component. A live run confirmed why: statically importing the REAL point_of_sale Navbar
//   pulls in 9 further POS-app files transitively (pos_hook, cashier_name, proxy_status,
//   sync_popup, sale_details_button, product_screen [~19 further imports of its own], input,
//   order_tabs, customer_display/utils) that are not part of the shared `web.assets_unit_tests`
//   bundle. Odoo's module loader treats any such unresolved dependency as a FATAL "modules ...
//   have not been defined" console error, which unit_test_error_checker aborts the entire web
//   unit-test suite on, before any test body runs - confirmed live via
//   `-u web --test-tags "/web:WebSuite.test_unit_desktop"`. Adding the real transitive closure
//   would mean pulling in effectively the whole POS UI tree into a bundle every OTHER module's
//   unit tests also load - the same "mount the whole POS Chrome" disproportion the removed 18.0
//   QUnit harness embodied, now confirmed structurally at the bundle level, not just at the OWL
//   hook level.
// - mock_navbar_module.js registers a dependency-free stand-in under the exact same module name
//   ("@point_of_sale/app/navbar/navbar") via a manual odoo.define() call - the same idiom core
//   itself uses (addons/web/static/lib/owl/odoo_module.js: `odoo.define("@odoo/owl", [], () =>
//   ...)`). This is the smallest viable unit that still exercises the REAL, unmodified guard code
//   from navbar.js: the mock's setup() is a safe, hook-free base (point_of_sale's real
//   Navbar.setup() calls OWL hooks - usePos/useService/useState - that only work inside a genuine
//   component mount, which this suite never attempts), and @web/core/utils/patch (real,
//   unmodified) applies viin_brand_pos's real patch on top of it exactly as it would the real
//   class.
test("branded POS navbar setup() bails out early without throwing when there is no current company", () => {
    const navbar = Object.create(Navbar.prototype);
    navbar.env = { services: {} }; // no `company` service registered at all - the guarded case

    expect(() => navbar.setup()).not.toThrow();
});

// Companion control: proves the patched setup() is not simply a no-op end to end (i.e. that the
// mock Navbar swap above did not accidentally neutralize the guard's ELSE branch too) - when a
// current company IS available, the favicon must actually be updated.
test("branded POS navbar setup() sets the favicon from the current company when one is available", () => {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = "/original-favicon.ico";
    getFixture().appendChild(icon);

    const navbar = Object.create(Navbar.prototype);
    navbar.env = { services: { company: { currentCompany: { id: 7 } } } };

    navbar.setup();

    expect(icon.getAttribute("href")).toBe("/web/image/res.company/7/favicon");
});
