module.exports = (options) => {
  return (req, res, next) => {
    switch (options.user) {
      case 'ADMIN':
        if (req.user !== undefined && req.user.isAdmin !== undefined && req.user.isAdmin) {
          next()
        } else {
          res.redirect('/')
        }
        break
      case 'TEACHER':
        if (req.user !== undefined && req.user.isTeacher !== undefined && req.user.isTeacher) {
          next()
        } else {
          res.redirect('/')
        }
        break
      default:
        if (req.user) {
          next()
        } else {
          res.redirect('/')
        }
    }
  }
}
