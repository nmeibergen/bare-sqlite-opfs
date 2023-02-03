export default {
  plugins: [{
    name: 'OPFS-accessibility',
    transform(context) {
      context.set('Cross-Origin-Embedder-Policy', 'require-corp');
      context.set('Cross-Origin-Opener-Policy', 'same-origin');
    },
  }, ],
};