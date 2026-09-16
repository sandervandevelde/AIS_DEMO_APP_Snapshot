//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import App from "@/App";
import { AuthContext } from "@/hooks/auth.context";

function renderApp() {
    return render(
        <AuthContext.Provider
            value={{
                session: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            }}
        >
            <App />
        </AuthContext.Provider>,
    );
}

describe("App", () => {
    it("renders without throwing", () => {
        expect(() => renderApp()).not.toThrow();
    });

    it("mounts content into the document", () => {
        renderApp();
        expect(document.body).not.toBeEmptyDOMElement();
    });
});
