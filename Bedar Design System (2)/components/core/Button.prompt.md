# Button

The primary interactive control. Use `primary` for the top action on a view; `secondary`, `ghost`, or `outline` for adjacent actions; `danger` for destructive intents.

```jsx
<Button variant="primary" size="md" onClick={submit}>Apply now</Button>
<Button variant="secondary" iconLeft={<ArrowIcon/>}>Learn more</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete program</Button>
<Button variant="primary" loading>Saving…</Button>
```

## Notes
- `size` — sm 32 · md 40 · lg 48; heights meet the 8px grid.
- `loading` swaps content for a spinner and blocks clicks.
- `block` fills the container width — useful on forms and mobile.
