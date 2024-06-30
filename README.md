# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

Welcome to my personal project Cantu's Kitchen!
When Covid first hit in 2019 and we were all stuck at home, I took up cooking.
Since then, I have been hosting dinner parties for my friends in an attempt to
cultivate my cooking skills, connect with my friends, and make some money while
I do it. 

# =================
# = Website Scope =
# =================
PRIMARY GOAL:
- Generate grocery lists for the meals I cooking
    - grocery lists grouped into ailse/departments
    - can customize order of grocery groups according to 
- a page for adding ingredients
- a page for adding recipes
- Showcase recipies for people that want to join or host a Cantu's Kitchen

SECONDARY GOAL
- Smart recommendations to reuse ingredients and limit repeat meals
- Maintain a "my pantry" to only add ingredients you don't have
- autofill for known ingredient names from database
- Automatically open create new ingredient page if spelling doesn't match an already established ingredient


OTHER GOALS
- Make a quiz to help Cantu's Kitchen participant figure out what they want to eat
- Photos from events of each recipe
- prioritize certain ingredient types
- log in protected recipe adding page
- set specific servings number for each recipe when making a grocery list
- users to have their own accounts with their own recipes
