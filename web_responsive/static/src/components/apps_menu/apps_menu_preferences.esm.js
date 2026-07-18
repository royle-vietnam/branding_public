/* Copyright 2023 Taras Shabaranskyi
 * License LGPL-3.0 or later (http://www.gnu.org/licenses/lgpl). */

import {Component, xml, onWillStart, useState} from "@odoo/owl";
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";
import {user} from "@web/core/user";

class AppsMenuPreferences extends Component {
    static props = {};
    static template = xml`
        <div t-if="state.hasSettingsAccess" class="o-dropdown dropdown o-dropdown--no-caret">
            <button
                role="button"
                type="button"
                title="App Menu Preferences"
                class="dropdown-toggle o-dropdown--narrow"
                t-on-click="_onClick">
                    <i class="fa fa-tint fa-lg px-1"/>
            </button>
        </div>
    `;
    setup() {
        this.action = useService("action");
        this.user = user;
        this.state = useState({hasSettingsAccess: false});

        onWillStart(async () => {
            this.state.hasSettingsAccess = await user.hasGroup("base.group_system");
        });
    }

    async _onClick() {
        const onClose = () => this.action.doAction("reload_context");
        const action = await this.action.loadAction(
            "web_responsive.res_users_view_form_apps_menu_preferences_action"
        );
        this.action.doAction({...action, res_id: this.user.userId}, {onClose}).then();
    }
}

registry
    .category("systray")
    .add("AppMenuTheme", {Component: AppsMenuPreferences}, {sequence: 100});
