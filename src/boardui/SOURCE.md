# BoardUI source

Components in this directory were obtained from the official public BoardUI registry at https://www.boardui.com/r/registry.json using the JSON component payloads listed there (CLI package version 0.5.9). Their original comments and Figma provenance are preserved. Local imports are namespaced to avoid overwriting shadcn controls.

The original global stylesheet's duplicate Tailwind entry import is removed because the host already compiles Tailwind v4. Theme overrides live in the host stylesheet. Product-specific adaptations are called out at their call sites. No Pro license has been obtained or inferred from the public component catalog. Earnings Chart Card and Bar List Card are pending licensed source and are not reproduced as lookalikes.

Sample template content must never be rendered as the user's trading data. BoardUI Settings Modal's default billing, plan, plugins and storage examples are not product features.