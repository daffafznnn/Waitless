export default defineEventHandler(async (event) => {
  return {
    ok: true,
    message: 'Auth check endpoint'
  }
})