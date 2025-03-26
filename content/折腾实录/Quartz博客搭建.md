---
title: 本博客抄作业指北
date: 2025-03-07
tags:
- Linux
- Github
- Quartz
---

话不多说
Obsidian + Github + Quartz + Caddy + CICD
静态博客+自托管全套方案简单指个北

# 前言
静态博客 绝大部分的方案 是第三方托管
`Github Pages`、`Cloudflare Pages`、`Vercel`云云
但都存在一个问题：**国内连接性差**
然而国内几家厂商的SaaS平台
一方面是要备案 另一方面大多没啥免费额度

我们必然是想用自己的服务器Selfhost的
问题来了：
> CI/CD怎么办

其实也是本篇的核心 剩下的都很简单且不重要

我原来的方案可以说巨抽象无比
Caddy拉一个套BasicAuth的WebDAV
然后把文章目录暴露出来
服务端用`systemd-path`
客户端用Obsidian+Remotely Save
客户端自动把文章通过 WebDAV推到服务器
然后服务器这边检测到目录更新自动build

我知道这听起来很抽象
是的 而且这样也不好用
新的方案 用的是`Github Webhook`
相对而言优雅很多

# Quartz
我从3.0的时候就在用这个框架了
非常的干净 非常的好看
完全支持Obsidian的特性

4.x版本对架构做了一些调整
部署就不聊了 非常的简单
直接看[官方教程](https://quartz.jzhao.xyz/)就行

在本地建立好Quartz的仓库并推到Github后
就可以在服务器端准备部署了

插句题外话
`v3`是能本地不需要Nodejs也能愉快写作的
现在`v4`参照了hugo和hexo的方式
让框架也托管了更新和同步到Git仓库
有好有坏吧 本地需要多装一个Node

# Selfhost
这里我采取的文件夹架构像这样：
```yaml
/www
- Quartz/
	- Blog/
	- CICD/
- ...
```

Blog文件夹即为Quartz的目录
`git clone`拉下来之后 确保`npm install`了

CICD里放CICD的脚本
```yaml
.../CICD
- venv/
- webhook.py
```

对的 还是推荐用`venv`

那`webhook.py`也不藏着掖着了 直接端出来
```python
from flask import Flask, request, jsonify
import subprocess
import hmac
import hashlib

# Configuration
HOST = "127.0.0.1"
PORT = 25080
DEBUG = True
REPO_PATH = "/www/Quartz/AilelixBlog"
BUILD_COMMAND = "npx quartz build"
GITHUB_SECRET = ""

app = Flask(__name__)

def VerifySignature(payload, signature):
    mac = hmac.new(GITHUB_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest("sha256=" + mac, signature)

@app.route("/webhook", methods=["POST"])
def webhook():

    Signature = request.headers.get("X-Hub-Signature-256")
    if GITHUB_SECRET and not VerifySignature(request.get_data(), Signature):
        return "Unauthorized", 403

    Data = request.json
    if Data.get("ref") != "refs/heads/v4":
        return "Not main(v4) branch, ignoring", 200

    try:
        subprocess.run(["git", "-C", REPO_PATH, "pull"], check=True)
        subprocess.run(BUILD_COMMAND, shell=True, cwd=REPO_PATH, check=True)
        return jsonify({"message": "Update successfully"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=DEBUG)
```

也没啥技术含量 随手拿`flask`糊了一个
需要注意的是，守护进程需要使用`venv`的`python`
```systemd
[Unit]
Description = Quartz Blog CICD Build

[Service]
Type = simple
User = caddy
Group = caddy
WorkingDirectory = /www/Quartz/CICD
ExecStart = /www/Quartz/CICD/venv/bin/python /www/Quartz/CICD/webhook.py
Restart = always

[Install]
WantedBy = multi-user.target
```

`Caddy`除了要需要手配一下`404 Page`
还需要反代一下CICD，端口和上文一致
```caddy
blog.ailelix.com {
    
    encode zstd gzip

    # Quartz Blog
    handle {
        try_files {path} {path}.html {path}/ =404
        root * /www/Quartz/AilelixBlog/public
        file_server
    }

    # 404 Page
    handle_errors {
        rewrite * /{err.status_code}.html
        file_server
    }

    # CICD Webhook
    handle /webhook {
        reverse_proxy :25080
    }
}
```

# Github
回到Github这里
`Repo` > `Settings` > `Webhooks`

创建新Webhook
URL填反代后的 类型是`application/json`
`Secret`和`webhook.py`中设置的保持一致

恭喜 就是这么简单 就是这么优雅
整个的写作流程就是
1. 打开Obsidian写
2. `npx quartz sync`
3. 结束 剩下完全不用操心

# 后记
这个方案也不是完全完美的
上文中的`webhook.py`
我本来想写成每次都重装一遍依赖
build完删除`node_modules`那种的
然而时间太久 `Github`收不到回复会认为超时
所以只有`git pull`和`npx quartz build`两行

主播主播 你的方案确实优雅
有没有更吃操作的方案呢？

有的兄弟 计划里有的
我现在这台VPS九月份到期
届时我可能会换IDC 玩点不一样的
想把所有云服务都往容器里整
对我说的不是`docker`
> `Kubernetes` + `MiniIO` + `Gitea` + `Selfhost CICD`

敬请期待