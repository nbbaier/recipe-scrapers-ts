import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		// Test environment
		environment: "node",

		// Test file patterns
		include: ["tests/**/*.{test,spec}.ts"],

		// Coverage configuration
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts", "src/types/**", "src/index.ts"],
			thresholds: {
				branches: 85,
				functions: 85,
				lines: 85,
				statements: 85,
			},
		},

		// Globals - makes describe, it, expect available without imports
		globals: true,

		// Test timeout
		testTimeout: 10000,

		// Setup files (if needed)
		// setupFiles: ['./tests/setup.ts'],
	},

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@test-data": path.resolve(__dirname, "../tests/test_data"),
		},
	},

	// Define global constants
	define: {
		TEST_DATA_PATH: JSON.stringify(
			path.resolve(__dirname, "../tests/test_data"),
		),
	},
});
