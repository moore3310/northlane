# GitHub Deployment Notes

This folder is ready to push to GitHub once Git is installed.

```bash
git init
git add .
git commit -m "Initial Northlane Secure Banking app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

For Render/Railway/Fly-style hosting:

- Runtime: Node.js
- Build command: none
- Start command: `npm start`
- Port: provided by the platform through `PORT`
