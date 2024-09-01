const bcrypt = require('bcrypt');
const HashPassword = async (password) => {
    const saltRound = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, saltRound);
}
module.exports = HashPassword