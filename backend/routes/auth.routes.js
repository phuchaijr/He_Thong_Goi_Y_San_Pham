const router = require("express").Router();
const AuthSystem = require("../auth-system");
const auth = new AuthSystem();

router.post("/register", async (req, res, next) => {
  try {
    const { fullname, email, password, confirmPassword } = req.body;

    const result = await auth.registerUser(
      fullname,
      email,
      password,
      confirmPassword,
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await auth.loginUser(email, password);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
