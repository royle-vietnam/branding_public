// @odoo-module ignore

// Test-only stand-in for point_of_sale/static/src/app/navbar/navbar.js, registered under the
// EXACT SAME module name via a manual odoo.define() call (bypassing the normal @odoo-module
// transpilation, which would otherwise derive this file's name from its own path).
//
// Why this exists: viin_brand_pos/static/src/app/navbar/navbar.js (the module under test) does
//     import { Navbar } from "@point_of_sale/app/navbar/navbar";
//     patch(Navbar.prototype, { setup() { super.setup(); ...guard... } });
// The REAL point_of_sale Navbar class pulls in 9 further POS-app files transitively
// (@point_of_sale/app/store/pos_hook, .../navbar/cashier_name/cashier_name, .../navbar/
// proxy_status/proxy_status, .../navbar/sync_popup/sync_popup, .../navbar/sale_details_button/
// sale_details_button, .../screens/product_screen/product_screen [itself ~19 further imports],
// .../generic_components/inputs/input/input, .../components/order_tabs/order_tabs, .../
// customer_display/utils) - none of which are part of the shared `web.assets_unit_tests` bundle,
// and point_of_sale's OWN Hoot unit suites (data_service/lna/related_models/render_service) never
// pull in ANY OWL component for exactly this reason. Listing the real navbar.js (or its
// transitive closure) in the shared bundle either 404s at runtime (files not served) or, if fully
// chased down, pulls in effectively the whole POS UI tree into a bundle every OTHER module's unit
// tests also load - confirmed live: Odoo's module loader treats any module it cannot fully
// resolve as a FATAL "modules ... have not been defined" console error, which
// unit_test_error_checker aborts the ENTIRE web unit-test suite on, before any test body runs.
//
// This mock supplies a minimal, dependency-free Navbar whose setup() is a safe, hook-free base -
// point_of_sale's real Navbar.setup() calls OWL hooks (usePos/useService/useState) that only work
// inside a genuine component mount, which navbar_favicon_guard.test.js deliberately does not
// attempt (see that file for the full reasoning). @web/core/utils/patch (real, unmodified) then
// applies the REAL, unmodified viin_brand_pos patch on top of this mock's prototype exactly as it
// would apply to the real class, so the guard code under test is genuine production code.
//
// Known trade-off: this shadows the real "@point_of_sale/app/navbar/navbar" module name for any
// OTHER test that might load in the SAME `web.assets_unit_tests` bundle. Today nothing else in
// this codebase lists the real point_of_sale/static/src/app/navbar/navbar.js in that bundle, so
// there is no collision - if that ever changes, "first registration wins" (module_loader.js)
// means whichever file's <script> tag runs first determines which Navbar every consumer sees.
(function () {
    "use strict";

    class MockNavbar {
        setup() {
            // Intentionally inert: point_of_sale's real Navbar.setup() wires up OWL hooks
            // (usePos/useService/useState) that require a genuine component mount. This test
            // never mounts one, so this stays a safe, hook-free base for the patch under test to
            // extend via `super.setup()`.
        }
    }

    odoo.define("@point_of_sale/app/navbar/navbar", [], function () {
        return { Navbar: MockNavbar };
    });
})();
