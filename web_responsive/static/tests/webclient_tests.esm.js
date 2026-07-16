/* global QUnit */
/* Copyright 2026 Viindoo
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {patchWithCleanup} from "@web/../tests/helpers/utils";
import {createWebClient} from "@web/../tests/webclient/helpers";
import {registry} from "@web/core/registry";
import {session} from "@web/session";

const serviceRegistry = registry.category("services");

/*
 * A minimal, spy-able stand-in for the core "menu" service
 * (@web/webclient/menus/menu_service). It replaces the real one so this
 * suite never depends on the /web/webclient/load_menus RPC or on the
 * "action" service's doAction pipeline: core WebClient._loadDefaultApp()'s
 * only observable side effect is `this.menuService.selectMenu(firstApp)`,
 * so recording that call is exactly "the stock post-login destination ran".
 */
function makeFakeMenuService(assert) {
    const menus = {
        root: {id: "root", children: [1], name: "root", appID: "root"},
        1: {id: 1, children: [], name: "App0", appID: 1, xmlid: "menu_1"},
    };
    return {
        dependencies: [],
        start() {
            return {
                getMenu: (menuId) => menus[menuId],
                getAll: () => Object.values(menus),
                getApps: () => menus.root.children.map((id) => menus[id]),
                getCurrentApp: () => undefined,
                setCurrentMenu: () => undefined,
                reload: () => undefined,
                selectMenu(menu) {
                    const menuId = typeof menu === "number" ? menu : menu.id;
                    assert.step(`selectMenu:${menuId}`);
                },
            };
        },
    };
}

/*
 * A minimal, spy-able stand-in for web_responsive's real "apps_menu" service
 * (static/src/components/apps_menu/apps_menu_service.js). Recording
 * toggleMenu() is exactly "the Apps menu was opened instead of the stock
 * destination".
 */
function makeFakeAppsMenuService(assert) {
    return {
        dependencies: [],
        start() {
            return {
                toggleMenu(openState) {
                    assert.step(`toggleMenu:${openState}`);
                },
            };
        },
    };
}

QUnit.module("web_responsive WebClient _loadDefaultApp");

QUnit.test(
    "preference enabled -> lands on the Apps menu instead of the stock destination",
    async (assert) => {
        serviceRegistry.add("menu", makeFakeMenuService(assert));
        serviceRegistry.add("apps_menu", makeFakeAppsMenuService(assert));
        patchWithCleanup(session, {apps_menu: {is_redirect_home: true}});
        await createWebClient({});
        assert.verifySteps(
            ["toggleMenu:true"],
            "the Apps menu opened and the stock default-app selection never ran"
        );
    }
);

QUnit.test(
    "preference disabled -> lands on Odoo's standard post-login destination",
    async (assert) => {
        serviceRegistry.add("menu", makeFakeMenuService(assert));
        serviceRegistry.add("apps_menu", makeFakeAppsMenuService(assert));
        patchWithCleanup(session, {apps_menu: {is_redirect_home: false}});
        await createWebClient({});
        assert.verifySteps(
            ["selectMenu:1"],
            "the stock default-app selection ran and the Apps menu was never opened " +
                "- guards against shipping the preference with an inverted direction"
        );
    }
);

QUnit.test(
    "no apps_menu preference on the session -> lands on the standard destination, no throw",
    async (assert) => {
        serviceRegistry.add("menu", makeFakeMenuService(assert));
        serviceRegistry.add("apps_menu", makeFakeAppsMenuService(assert));
        // Deliberately no session.apps_menu at all: session.apps_menu?.is_redirect_home
        // must resolve to undefined (falsy) rather than throw on a property read of
        // undefined.
        await createWebClient({});
        assert.verifySteps(["selectMenu:1"]);
    }
);

QUnit.test(
    "apps_menu service unavailable -> still lands on the standard destination without throwing",
    async (assert) => {
        serviceRegistry.add("menu", makeFakeMenuService(assert));
        // Deliberately do NOT register "apps_menu": this is the isolated
        // core-component scenario commit 0dc7571 exists to protect (NavBar /
        // BurgerMenu / WebClient mounted without web_responsive's apps_menu
        // service present). The preference is left "on" on purpose - even when
        // the user wants the Apps menu, the guard must still fall back safely.
        patchWithCleanup(session, {apps_menu: {is_redirect_home: true}});
        await createWebClient({});
        assert.verifySteps(
            ["selectMenu:1"],
            "the stock default-app selection ran even though apps_menu was unavailable"
        );
    }
);
