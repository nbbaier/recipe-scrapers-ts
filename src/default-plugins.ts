/**
 * Default plugin configuration.
 *
 * This module is imported for side effects from entry points that construct
 * scrapers (e.g. `src/index.ts` and `src/factory.ts`).
 */

import {
        BestImagePlugin,
        ExceptionHandlingPlugin,
        HTMLTagStripperPlugin,
        NormalizeStringPlugin,
        OpenGraphFillPlugin,
        OpenGraphImageFetchPlugin,
        SchemaOrgFillPlugin,
        StaticValueExceptionHandlingPlugin,
} from "./plugins";
import { configureDefaultPlugins } from "./settings";

configureDefaultPlugins([
        ExceptionHandlingPlugin,
        BestImagePlugin,
        StaticValueExceptionHandlingPlugin,
        HTMLTagStripperPlugin,
        NormalizeStringPlugin,
        OpenGraphImageFetchPlugin,
        OpenGraphFillPlugin,
        SchemaOrgFillPlugin,
]);
