# TreeRow

A category tree row: name, branch total, share bar and in-place expansion of the subtree.

- Level indent — 16 px; the root is in bold.
- Modes: view (Обзор — "Overview"), pick (the category picker sheet, the «Выбрать этот уровень» ("Select this level") button), edit (the menu «Переименовать» ("Rename"), «Перенести в…» ("Move to…"), «Бюджет…» ("Budget…"), «В архив» ("Archive")).
- Expenses assigned directly to a parent are a row «Напрямую в „Стройка“» ("Directly in Construction") in the `text-2` colour.
- `role="treeitem"`, `aria-level`, `aria-expanded`, `aria-selected`.
