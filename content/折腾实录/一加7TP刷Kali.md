---
title: 一加7TPro刷NetHunter教程
date: 2025-07-31
tags:
- Kali Linux
- OnePlus
- Android
---

> Net Hunter套件仅供网络安全学习使用，请勿从入门到入狱

# 前言
闲来无事 突然想给手里的一加7T Pro刷个Kali Linux (Net Hunter)玩玩
网络上教程很少，且都是基于氧OS10的
官方教程有些问题 摸索攻关后写下了此踩坑教程

这篇教程默认你拥有一加系设备的刷机知识
细节操作会完全略过 只教大概思路
知道TWRP、Magisk与Net Hunter为何物
理论上 此教程通用一加7全系(7 7Pro 7T 7TPro)
以下OOS 代指氧OS

# 准备工作
9008工具及OOS11 9008包
OOS11 卡刷包
[TWRP](https://www.twrp.me/Devices/OnePlus/)
DXY-Tool（请在小绿书自行搜索获取）
[Magisk(这里使用的是Kitsune)](https://github.com/1q23lyc45/KitsuneMagisk/releases)
[Nethunter](https://www.kali.org/get-kali/#kali-mobile)
[内核(可能需要)](https://xdaforums.com/t/kali-nethunter-for-the-oneplus-7-oneplus-7-pro.4602229/)
[无线固件(可能需要)](https://github.com/rithvikvibhu/nh-magisk-wifi-firmware/)

# I. 9008 OOS11
没太多好说的
9008 OOBE 解BL 再OOBE一条龙

# II. TWRP OOS11
这里理论上是没有坑的
我的9008的OOS11和卡刷包是完全一样的版本
但是很神奇的是
后者提取的boot.img刷进去没法引导前者
结果就是硬控了我两个小时
所以这个地方保险起见 我们选择重新卡刷一遍

那么流程就是
进bootloader 刷twrp
twrp里adb sideload刷OOS11卡刷包
然后OOBE

`别忘了此时这个slot的recovery是原版的，也要刷成twrp`

# III. 改读写+禁强制验证
这一步需要解释一下

> [!hint] SystemRW与Disable Force Encrypt
> NetHunter的侵入性比较大的
> 需要`/system`分区可读写并关闭强制验证
> 这俩是什么含义这里就不赘述了
> 通常的做法是twrp内刷入：
> `systemrw_1.32_flashable.zip`
> `Disable_Dm-Verity_ForceEncrypt_11.02.2020.zip`
> 或者二合一的脚本`RO2RW-TEST-3.7.3.0s.zip`
> 
> 然而经过我被硬控一整晚后发现
> 上面那俩+Magisk刷完会导致bootloop(无论版本或顺序)
> 下面这个二合一脚本会报错

所以我们这里采取的是手动的做法
使用`DXY-Tool`提取卡刷包、改读写与强制验证

解压DXY-Tool，目录不允许中文 空格 特殊字符
把卡刷包放到exe同目录下
终端打开exe 选择卡刷包zip 会自动解压并创建项目
![DXY-Tool-Menu](https://img.ailelix.com/i/2025/07/31/688b8483553d0.webp)
我们选择`5`
![DXY-Tool-Plugin](https://img.ailelix.com/i/2025/07/31/688b8483cd43d.webp)
依次选择`3`和`4` 然后回到主菜单选择`33`

操作完成后应该工作目录下额外有两个文件夹
```yaml
DXY-Tool.exe
Oxygen11.0.9.1.zip
Oxygen11.0.9.1/:
 - DXY
 - DXY-ROM
 - ...
```

其中，`DXY`文件夹有以下五个镜像
> `odm.img`
> `product.img`
> `system.img`
> `system_ext.img`
> `vendor.img`

我们还需要`DXY-ROM`中的`vbmeta.img`

我们重启进入fastbootd`twrp的fastboot`
然后依次刷写上面五个分区

然后刷入Magisk，重启

> [!hint] TWRP刷Magisk
> 从v22开始
> Magisk不再区分核心与Manager
> 而那个Magisk的apk
> 直接后缀改成zip就能用twrp刷入

如果你此时遇到`Qualcomm CrashDump Mode`并且下方小字
```
dm-verity device corrupted Force Dump
kernel_restart
```

那么就去bootloader刷入上文的`vbmeta`并关闭验证：
```sh
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
```

现在应该就能正常进系统了
检查一下Magisk功能是否正常
`system`分区是否可读
然后就可以把NetHunter拷进手机了

# IV. 安装NetHunter
Magisk安装模块，选NetHunter.zip
耐心等待安装完毕重启

有可能会开机遇到`Qualcomm CrashDump Mode`
且下方没有小字
此时大概率是内核兼容性问题
进twrp，刷入上文的那个内核

不出意外的话，现在可以正常使用了

> Enjoy hacking!

 如果发现蓝牙不可用
 就去twrp刷上文的无线固件
 这个repo直接就是脚本内容
 拷贝下来打成个zip就可以刷

# 后记
这个NetHunter
本质上就是以一个安卓为底
给系统增加一层hacking软件包

理论上是可以不用OOS的
NetHunter和twrp有Custom A11版
不过我也懒得折腾了

并且理论上可以兼顾日用
但是似乎不能开MagiskHide
也不是很能日用就是

另外在我的7TP上
蓝牙伪装设备功能不可用
可惜 最爽的功能的没玩上

此外这玩意发热有点哈人
我没试，但装个scene有望缓解