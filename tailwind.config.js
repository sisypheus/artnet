module.exports = {
  purge: {
    enabled: true,
    content: [
      "./src/**/*.{html,ts}",
      "./projects/**/*.{html,ts}"
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        '92': '22rem',
        '102': '26rem',
        '108': '28rem',
        '112': '30rem',
        '114': '31rem',
        '115': '31.3rem',
        '116': '32rem',
      },
      height: {
        '108': '28rem',
        '112': '30rem',
        '114': '31rem',
        '115': '31.3rem',
        '116': '32rem',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
