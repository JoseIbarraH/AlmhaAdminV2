export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'slate'
    },
    dropdownMenu: {
      slots: {
        content: 'min-width-48 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl p-1.5 focus:outline-none z-50',
        item: 'group flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-amber-600 dark:hover:text-amber-500 transition-colors cursor-pointer'
      }
    }
  }
})
