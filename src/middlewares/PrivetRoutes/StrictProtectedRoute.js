const StrictProtectedRoute = async (HaveAccess, GiveAccess) => {
    if (HaveAccess === GiveAccess) {
        return { access: true }
    } else {
        return { access: false };
    }
}
module.exports = { StrictProtectedRoute }