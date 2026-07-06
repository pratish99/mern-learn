import type { ModuleContent } from "@/lib/types";

const reactFormsEvents: ModuleContent = {
  id: "react-forms-events",
  title: "Forms & controlled inputs",
  category: "Hooks & State",
  order: 6,
  explanation: `
In plain HTML, an \`<input>\` owns its own value — the browser tracks what
you typed, and JavaScript only reads it when asked. React usually flips
this around with **controlled inputs**: the component's state is the
single source of truth, and the input's \`value\` is just a reflection of
that state.

\`\`\`jsx
function NameField() {
  const [name, setName] = useState("");
  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
\`\`\`

Every keystroke fires \`onChange\`, which reads the new text off
\`e.target.value\` and calls \`setState\`, which triggers a re-render that
feeds that same value straight back into \`value={name}\`. It looks
circular, but it's exactly the "state in, UI out" model from the earlier
modules: the input never has authority over its own displayed value —
your state does. This is what makes things like "clear this field from a
button elsewhere" or "validate as the user types" trivial: they're just
ordinary state updates, not DOM manipulation.

### One handler, many fields

Forms rarely have just one field. Rather than writing a separate
\`onChange\` per input, a common pattern reads the input's own \`name\`
attribute and uses a computed property key to update just that slice of
state:

\`\`\`jsx
function handleChange(e) {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
}

<input name="email" value={form.email} onChange={handleChange} />
<input name="password" value={form.password} onChange={handleChange} />
\`\`\`

\`[name]: value\` is plain JavaScript computed-property syntax — nothing
React-specific — but it's what makes a single handler scale to any
number of fields.

### Different input types report their value differently

\`event.target\` shapes itself around the input type: a checkbox exposes
a boolean via \`target.checked\` (not \`target.value\`, which is always the
string \`"on"\` regardless of checked state), and a number input's
\`target.value\` is still a **string** — React doesn't coerce it for you,
so code that wants an actual number has to call \`Number(...)\` itself
(and decide what an empty string should become, since \`Number("")\` is
\`0\`, which usually isn't what "the user cleared the field" should mean).

### Why this matters

"Controlled" isn't a special mode you opt into — it's the direct
consequence of feeding \`value\` from state and updating that state
\`onChange\`. Every form quirk (single handler via \`[name]\`, checkboxes
needing \`checked\` instead of \`value\`, number inputs needing manual
coercion) falls out of "the DOM node just renders whatever state you
hand it, and the browser's native event is your only signal that the
user tried to change it."
`.trim(),
  codeExamples: [
    {
      title: "One onChange handler for every field",
      code: `const [form, setForm] = useState({ email: "", password: "" });

function handleChange(e) {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
}

<input name="email" value={form.email} onChange={handleChange} />
<input name="password" type="password" value={form.password} onChange={handleChange} />`,
    },
    {
      title: "Checkboxes and number inputs need special handling",
      code: `function handleChange(e) {
  const { name, type, value, checked } = e.target;
  const nextValue = type === "checkbox" ? checked
    : type === "number" ? (value === "" ? "" : Number(value))
    : value;
  setForm((prev) => ({ ...prev, [name]: nextValue }));
}`,
    },
  ],
  challenge: {
    functionName: "handleChange",
    prompt: `Write handleChange(formState, target) that simulates a generic onChange
handler for a controlled form. "target" mimics event.target: { name, type,
value } for text/number inputs, or { name, type: "checkbox", checked } for
checkboxes. Return a new form state object with only that field updated,
following these rules: a checkbox uses "checked" as its value; a number
input parses "value" with Number(), except an empty string stays an empty
string (not NaN or 0); any other input type uses "value" as-is. Every
other field on formState must be left untouched.`,
    starterCode: `function handleChange(formState, target) {
  // your code here
}`,
    solutionCode: `function handleChange(formState, target) {
  let nextValue;
  if (target.type === "checkbox") {
    nextValue = target.checked;
  } else if (target.type === "number") {
    nextValue = target.value === "" ? "" : Number(target.value);
  } else {
    nextValue = target.value;
  }
  return { ...formState, [target.name]: nextValue };
}`,
    testCases: [
      {
        name: "text input updates by name",
        args: () => [{ name: "", agree: false }, { name: "name", type: "text", value: "Ada" }],
        expected: { name: "Ada", agree: false },
      },
      {
        name: "checkbox uses checked, not value",
        args: () => [{ name: "Ada", agree: false }, { name: "agree", type: "checkbox", checked: true }],
        expected: { name: "Ada", agree: true },
      },
      {
        name: "number input coerces to a number",
        args: () => [{ age: 0 }, { name: "age", type: "number", value: "25" }],
        expected: { age: 25 },
      },
      {
        name: "clearing a number input keeps an empty string",
        args: () => [{ age: 5 }, { name: "age", type: "number", value: "" }],
        expected: { age: "" },
      },
      {
        name: "only the touched field changes",
        args: () => [{ a: 1, b: 2 }, { name: "b", type: "text", value: "z" }],
        expected: { a: 1, b: "z" },
      },
    ],
  },
};

export default reactFormsEvents;
