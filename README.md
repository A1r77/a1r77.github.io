# EDGEBUG Quantum Nodes

这是一个纯静态的 GitHub Pages 页面，不需要构建工具。

## 页面内容

- HNS 服务器: connect edgebug.cn
- 刀服: connect edgebug.cn:27016
- 滑翔服 Surf: connect edgebug.cn:27017
- 滑翔对抗: connect edgebug.cn:27018
- 跳狙飞人: connect edgebug.cn:27019

## 直接部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 把当前目录中的文件上传到仓库根目录。
3. 在仓库 Settings -> Pages 中，Source 选择 Deploy from a branch。
4. Branch 选择 main，Folder 选择 /(root)。
5. 保存后等待部署完成。

如果你希望把这个目录放在大型仓库中，也可以把这里的内容放到 docs 目录，然后在 Pages 里把 Folder 设为 /docs。

## 本地预览

在本目录运行任意静态服务器即可，例如：

- python -m http.server 8080

然后访问 http://localhost:8080
