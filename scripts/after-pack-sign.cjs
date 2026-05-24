const { execFileSync } = require("node:child_process")

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") {
    return
  }

  execFileSync("codesign", ["--force", "--deep", "--sign", "-", context.appOutDir + "/DailyNotes.app"], {
    stdio: "inherit"
  })
}
