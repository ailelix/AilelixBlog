---
title: 宿舍All in One，启动！
date: 2025-01-19
tags:
- Linux
- NAS
- Network
---

起因是这样的，新学期增添了几个需求：
1. 宿舍的墙插很烂，虽然百兆但协商的时候会闪灯，有时候会协商到10M
2. 把VR带到UK这边来了，宿舍楼的WiFi有设备隔离，需要自己的路由器
3. 宿舍网是完美的家宽IP，假期不断电，挂个NAS落地代理岂不美哉

如果你也在搞宿舍All in One，那这篇博客很适合作为方案参考

# 硬件准备
- 体积小（要从国内坐飞机运过去）
- 双网口
- 能做无线AP
- 最好便宜点
- 最好能挂存储

那么，比较正常的方案就剩下了：
1. WiFi 6小路由器 + OpenWRT
自由度低，省事
2. 小工控机 + 无线网卡 + OpenWRT
自由度高，~~不是那么折腾~~
3. 小工控机 + 无线网卡 + Linux
自由度高，比较折腾

先来聊路由器，我搜罗了一圈，最可行的是这货：
![Cudy TR3000](https://img.ailelix.com/i/2025/01/21/678fc09b97b1f.webp)
属于出口转内销的小玩具
参数一览：
> MT7981 2xCortex-A53
> 512M RAM + 128M ROM
> 双外置天线 + 一内置天线，2x2 MIMO
> 2.5G WAN + 1G LAN RJ45
> USB3.0 A口一枚
> 5V3A PD供电
> 可刷OpenWRT

淘宝/黄鱼价格150-190￥
直面参数很香 宿舍路由器优选，然而：
1. 据说A口有供电问题，带移动硬盘要改电
2. 双核A53+512M内存带All in One（尤其qBittorrent）未免`有些太拼命了`

1其实还好，2确实是没辙
虽然这个东西我没摸到
但看起来大概率是香的一批的 搭一些轻量的足够了

于是在黄鱼搜索`软路由小主机`搜罗到一个这个：
![三网口超薄J1900软路由](https://img.ailelix.com/i/2025/01/22/679021eb926fb.webp)
买来的内存和SSD都换掉了参数一览：
> J1900 4C4T
> 4G DDR3L 1600MT/s（8G那根我找不到了）
> 3x 千兆RJ45
> 1x miniPCIe 插了张AX200
> 1x 2.5" Sata 接了块光威奕Pro 128G
> 1x mSata 插了块Netac 512G

`是的，纯纯的组垃圾，性价比拉满`
懂的都懂
这个接口配置在这个品类简直是降维打击，应有尽有
先上一张成品图：
`壳子只有一个天线口，但前面板是塑料，在内侧贴了一根天线`
![成品组装图](https://img.ailelix.com/i/2025/01/22/679028646f5ce.webp)

说来也感慨
初一的时候初次接触到NAS和Linux
就是J1900
你大概可能猜到了，对，蜗牛星际B双
那还是CentOS 7叱咤的年代
2T紫盘+1T希捷OEM+500G蓝盘+500GHitachi(不是HGST)
组成的Raid 10传奇灵车
甚至这颗羸弱的CPU还担负了跑MC服务器的工作
1.14.4还是一个多核优化不怎么样的年代
为了能流畅生电，把paper的配置文件摆弄的死去活来

现如今，我家里的NAS都升级到天上去了
> 5800X + 32G DDR4@3200MT/s + 2080Ti
> 980Pro 500G + Intel 545S 256G + 1T HGST
> 两块6T黑盘 Raid 1
> `没有任何炫耀的意思`

然而还是逃不过这颗神U的手掌心吗（笑

# 唉，英特尔
你可能注意到了
我给这个机子插了一张ax200
意味着要用ax200开AP

折腾过类似配置的，可能已经开始笑了
简单来说 事情是这样的：

> [!info] 英特尔网卡与AP模式
> 在WiFi6时代，各个国家所允许使用的信道各不相同
> 但作为销售往全球的产品，ax200是支持全信道的
> 如何避免侵犯当地法律呢？Intel推出了LAR`Location Aware Regulatory`
> 在AP模式下，开启AP时，网卡会先搜索临近的信号，以确定地区
> 本意是好的，但是在Linux下搭载LAR的驱动`iwlwifi`会炸
> 表现为打开AP时会失败，只能开2.4Ghz的AP
> 在Linux Kernel 5.5前可通过内核启动项参数关闭
> 在其之后只能使用修改版的`iwlwifi`或`hostapd`

所以，用这玩意上OpenWRT是肉眼可见的痛苦
据说有些版本的固件是提供了修改好的`hostapd`
但我试了官方固件和几个流行的固件，结果是都不行

# Arch Linux，启动
码了一千字了，才到算是点干货的地方

这一节我会向你展示如何正确地在ax200上开出来5Ghz AP
如何设置网桥、编写路由表、配置dhcp服务、配置DNS服务器
来用软件达成一个最简的路由器
这里我假定读者拥有基本的计网基础与一定的Linux基础
我的宿舍网络环境只有IPv4，如果你在配置IPv6，那么祝你好运

我使用的软件是：
> Arch Linux
> Network Manager
> iptables
> hostapd-wifi6
> kea
> SmartDNS

不一定非得要Arch，但是一方面是我顺手
另一方面是上文提到的修改版`iwlwifi`和`hostapd`都有AUR打包
`伟大，无需多言`

## Network Manager
为了方便配置，我删掉了Network Manager的默认连接
`请根据实际情况修改带<>的内容`

把作为WAN口单独拉出来做一个配置
```sh
nmcli connection add type ethernet ifname <enp4s0>
```

然后把剩下两个LAN口接到同一个网桥上
```sh
nmcli connection add type bridge ifname br0 stp no
nmcli connection add type bridge-slave ifname <enp2s0> master br0
nmcli connection add type bridge-slave ifname <enp3s0> master br0
```
既然服务器在LAN上表现为一个路由器，自然是设置为静态IP的
```sh
nmcli connection modify bridge-br0 ipv4.address <192.168.1.1/32>
nmcli connection modify bridge-br0 ipv4.method manual
```

我们要用hostapd来搭AP，所以让Network Manager不再托管无线网卡
在`/etc/NetworkManager/conf.d/`下创建`unmanaged.conf`:
```systemd
[keyfile]
unmanaged-devices=interface-name:<wlp1s0>
```
重启`NetworkManager.service`生效

前文提到，我宿舍的墙插质量很烂 容易协商失败或者协商到10M
并且这个东西很有意思，放在那里一直闪灯然后过十几分钟就能碰运气
然后协商到正确的百兆
希望读者不会遇到很烂的墙插`这个水晶头打的还没我打的好`

为了能不断尝试协商100M 我们需要对WAN口的配置稍作修改
```sh
nmcli connection modify <eth-wan0> 802-3-ethernet.duplex full 802-3-ethernet.speed 100
nmcli connection modify <eth-wan0> connection.autoconnect-retries -1
```
请注意，`duplex`和`speed`要同时修改才能生效

在我这里，LTS内核的驱动似乎并不能正常工作
另外安装了`r8168-lts`

## 路由表
路由器，自然需要路由表
修改`/etc/iptables/iptables.rule`:
```
*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]
-A POSTROUTING -o <enp4s0> -j MASQUERADE
COMMIT

*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A FORWARD -i <br0> -o <enp4s0> -j ACCEPT
-A FORWARD -i <enp4s0> -o <br0> -m state --state RELATED,ESTABLISHED -j ACCEPT
COMMIT
```

启用并运行`iptables.service`

## DHCP
就不用什么陈旧的dhcpd了，直接用kea
修改`/etc/kea/kea-dhcp4.conf`
```json
{
	"Dhcp4": {
		"interfaces-config": {
			"interfaces": [ <"br0"> ]
		},
	
		"subnet4": [
			{
				"id": 1,
				"subnet": "192.168.1.0/24",
				"pools": [ { "pool": <"192.168.1.100 - 192.168.1.200"> } ],
				"option-data": [
					{
						"name": "routers",
						"data": <"192.168.1.1">
					},
					{
						"name": "domain-name-servers",
						"data": <"192.168.1.1">
					}
				]
			}
		]
	}
}
```

启用并运行`kea-dhcp4.service`

## SmartDNS
根据网络情况选择合适的DNS服务商与协议
`/etc/smartdns/smartdns.conf`
```
bind [::]:53
dualstack-ip-selection no

server-tls 1.1.1.1
server-tls 8.8.8.8
```

启用并运行`smartdns.service`

## hostapd
终于到了重点了
经过我的尝试
对于Linux Kernel 6.6 LTS来说
`iwlwifi-lar-disable-dkms`并不管用
`hostapd-noscan`也不管用
`hostapd-wifi6`是管用的
创建`/etc/hostapd/hostapd_AAA.conf`:
```toml
interface=<wlp1s0>
bridge=<br0>

ssid=<WiFI的SSID>
utf8_ssid=1

driver=nl80211
# 国家代码
country_code=<GB>

# 802.11a
hw_mode=a
# 酌情修改信道
channel=149
# 最大允许设备数
max_num_sta=4
# WiFi6 (802.11ax)的配置
ieee80211ax=1
# 我不确定束波赋形在ax200上是否有用
he_su_beamformer=1
he_mu_beamformer=1
preamble=1

# 这一段配置WiFi为仅使用WPA3-personal
wpa=2
auth_algs=1
ieee80211w=2
wpa_pairwise=CCMP
wpa_key_mgmt=SAE
wpa_passphrase=<WiFi密码>

logger_stdout=-1
logger_stdout_level=2
```

启用并运行`hostapd@AAA.service`

## sysctl
理论上你现在可以看到对应的SSID并连接了
但是连不上网
别忘了开启IP转发
编辑`/etc/sysctl.d/99-sysctl.conf`:
```toml
net.ipv4.ip_forward = 1

net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

vm.swappiness=1
net.core.netdev_max_backlog = 16384
net.core.somaxconn = 8192
net.core.rmem_default = 1048576
net.core.rmem_max = 16777216
net.core.wmem_default = 1048576
net.core.wmem_max = 16777216
net.core.optmem_max = 65536
net.ipv4.tcp_rmem = 4096 1048576 2097152
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.udp_rmem_min = 8192
net.ipv4.udp_wmem_min = 8192
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_mtu_probing = 1
```

然后`sysctl -p /etc/sysctl.d/99-sysctl.conf`

只有第一行是必需的（如果有IPv6也别忘了）
第二节开启BBR我个人认为是有网络性能帮助的
第三节就是比较玄学的部分了
请注意，开启后会明显增加转发流量时的性能开销
这颗J1900会从室温变成温热

一套流程走下来 基本就搭好了一个最简单的路由器了
然后就是挂samba，qbittorrent云云

# 结果呢
总体来说还是满意的
然而，VR的需求没能很好地解决
> 我确实高估ax200的性能了

二把刀确实是打不过专业的
这个AP 客户端连接速度也就280Mbps左右的样子
刷刷手机确实够了且很不错 我人在两堵墙外的厨房都有信号

但是跑VR串流确实过于吃力了，发射功率太差
正面对着的时候就很流畅丝滑
稍微转个九十度就会卡一下
完全转过身会大卡一下然后再恢复
`我确定不是束波赋形的锅`
基本处于一个不可用的状态

然后玩的话还是得笔记本开热点
MT7925还是强的多的多
不过VR看视频是完全ok的（我是128G的Quest 3）
下载到NAS里直接samba在VR里看完全没问题

总而言之吧 刚开学那两天没少折腾
还行吧 颜值 功能都雨露均沾了

# 后日谈
`30 March 2025`
没想到啊没想到
给NAS升级一下内存
开关机过程中不小心断电了
文件系统炸了 尝试修复无果得重装
这一篇指导意义并不是很强的博客
竟然也能回旋镖的 乐

`后后日谈`
给笔记本升级了QCNCM865
退役下来的MT7925给NAS了
这玩意在OpenWRT上正常工作
所以最后还是换了OpenWRT