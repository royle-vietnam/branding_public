/** @odoo-module **/

import { describe, expect, test } from "@odoo/hoot";
import { patchWithCleanup } from "@web/../tests/web_test_helpers";
import { Navbar } from "@point_of_sale/app/navbar/navbar";

describe.current.tags("headless");

// viin_brand_pos/static/src/app/navbar/navbar.js patches Navbar.prototype.setup() to set a
// branded favicon from the current company, guarded by:
//     const currentCompany = this.env.services.company?.currentCompany;
//     if (!currentCompany) { return; }
// Business rule under protection: that guard must make setup() bail out SAFELY (no throw) when
// the `company` service (or its currentCompany) is not available - not crash the whole POS UI.
// Without the guard, reading `currentCompany.id` on the next line throws a TypeError the moment
// the company service (or its currentCompany) is missing.
//
// Grounding (18.0, OSM):
// - js_test_inspect(module='point_of_sale', odoo_version='18.0') lists only 4 Hoot suites in
//   point_of_sale (data_service/lna/related_models/render_service.test.js) and NONE mounts an OWL
//   component - "mount the whole POS Chrome" (Navbar + its 8 child components CashierName/
//   ProxyStatus/SaleDetailsButton/Dropdown/DropdownItem/SyncPopup/OrderTabs/Input, each needing
//   their own services) was the QUnit harness removed at 18.0. Standing one up just to protect a
//   2-line defensive guard would be disproportionate - the same judgment already made by the
//   sibling Viindoo test erponline-enterprise18/viin_customizer/static/tests/js/views/fields/
//   customizer_field.test.js for a sibling Field.prototype patch, which tests it via
//   `Object.create(Prototype)` instead of a full mount.
//
// - Here that shortcut needs one extra step: point_of_sale's base Navbar.setup() calls OWL hooks
//   (usePos/useService/useState) that throw "No active component" outside a real component
//   construction (addons/web/static/lib/owl/owl.js, getCurrent()), so a bare
//   `Object.create(Navbar.prototype).setup()` would fail for that unrelated reason before ever
//   reaching our guard - never protecting anything. We neutralize *only* that unrelated hook
//   dependency with a throwaway stub patch applied to Navbar.prototype BEFORE the module under
//   test is loaded:
//     * @web/core/utils/patch stacks patches - each patch() call captures the CURRENT state of
//       the patched property as ITS OWN `super` at patch-time (addons/web/static/src/core/utils/
//       patch.js), so whichever patch runs later sees the earlier one as `super`.
//     * viin_brand_pos/static/src/app/navbar/navbar.js is registered LAZILY by Odoo's module
//       loader (odoo.define(name, deps, factory, lazy) - see addons/web/static/tests/_framework/
//       hoot_module_loader.js: any module whose name does not end in ".hoot" is lazy, i.e. not
//       auto-started at page load) - and this test file deliberately does NOT statically import
//       it, so it stays un-started until this test triggers it.
//     * odoo.loader.addJob(name) (addons/web/static/src/module_loader.js) starts an
//       already-registered lazy module on demand; reaching into `odoo.loader` from a Hoot test is
//       itself a precedented idiom (addons/mail/static/tests/emoji/emoji.test.js reads an
//       already-started module via `odoo.loader.modules.get(...)`).
//   Once the module under test is triggered this way, its `super.setup()` resolves to our inert
//   stub instead of the hook-based original - so calling `.setup()` on a bare receiver exercises
//   the REAL, unmodified guard code from navbar.js, with none of the surrounding OWL-hook
//   plumbing.
//
// This is a fallback shape, not a true component mount: it was not possible to execute against a
// live Hoot/browser instance in this authoring pass (no instance was provisioned for this task),
// so RED-before-green below is confirmed by code-path reasoning, not an observed run. A live run
// to confirm this mechanism (in particular, the addJob-triggered patch ordering) is recommended
// before relying on this test as the sole regression guard.
test("branded POS navbar setup() bails out early without throwing when there is no current company", () => {
    patchWithCleanup(Navbar.prototype, {
        setup() {
            // Inert stand-in for the real, hook-dependent point_of_sale Navbar.setup() - this
            // test's whole point is the guard added AFTER `super.setup()` in navbar.js, not the
            // hooks the base class wires up.
        },
    });
    const stubbedSetup = Navbar.prototype.setup;

    // Trigger the module under test now, after our stub is in place, so its
    // `patch(Navbar.prototype, {...})` call captures the stub above - not the hook-based
    // original - as `super`.
    odoo.loader.addJob("@viin_brand_pos/app/navbar/navbar");

    // Safety net: if the module under test did not actually layer its patch on top of the stub
    // (e.g. it was already started earlier for some other reason, or an assumption above no
    // longer holds), `setup` would still be our own stub and the assertion below would pass
    // vacuously without ever exercising navbar.js. Fail loudly instead of silently protecting
    // nothing.
    expect(Navbar.prototype.setup).not.toBe(stubbedSetup, {
        message:
            "viin_brand_pos's navbar.js patch must be layered on top of the stub for this " +
            "test to exercise real code - if this fails, the addJob/patch-ordering mechanism " +
            "this test relies on needs to be re-grounded",
    });

    const navbar = Object.create(Navbar.prototype);
    navbar.env = { services: {} }; // no `company` service registered at all - the guarded case

    expect(() => navbar.setup()).not.toThrow();
});
