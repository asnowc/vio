## 0.x

### 0.5.6

浏览器兼容性改进，Chrome 最低支持 109 版本

### 0.5.5

### 0.5.4

chore: 删除 config.json connectProtocol 默认值

### 0.5.3

### 0.5.2

默认的 rpc websocket 连接协议根据 location.protocol 确定

### 0.5.1

### 0.5.0

### 0.4.0

feat!: 新增定义中的命令的功能，见 VioTty.setCommand() 方法
feat!: 移除终端输入权的功能 移除
BREAKING(TTY)
BREAKING: 移除 VioHttpServerOption.staticHandler()
BREAKING: 移除 Vio.chart
BREAKING: 类 TtyCenter 改为导出接口，移除 TtyCenter.setReader()
BREAKING: 移除 VioObjectCenter.create()、VioObjectCenter.disposeChart()、VioObjectCenter.get()

#### 0.3.1

fix: TTY 滚动无法自动锁定

#### 0.3.0

BREAKING(TTY): 删除 TTY.writeText()，新增 TTY.log()、TTY.warn()、TTY.error()、TTY.info()

#### 0.2.0

##### API

feat: 新增 VioHttpServerOption.frontendConfig 选项，可以直接更改前端配置
feat: 新增 VioHttpServerOption.rpcAuthenticate 选项，可对RPC连接鉴权
feat: VioHttpServerOption 废弃 staticHandler，改为 requestHandler

feat: ChartCreateOption 新增 name、updateThrottle、onRequestUpdate选项
feat!: 废弃 vio.chart, 请使用 vio.object 代替
feat!: 新增 `vio.object.createTable()`

fix: http server 关闭连接应断开所有http连接

refactor!: RPC 接口更改

BREAKING CHANGE: 删除导出 ChartCenter
BREAKING CHANGE: 删除导出 FileData 请使用 VioFileData 代替
BREAKING CHANGE: `VioChart.onRequestUpdate()` 改为 `VioChart.requestUpdate()`

##### WEB

feat: chart 面板 tab 标签的标题显示未 VioChart.name

#### 0.1.1

fix: deno 通过 npm 导入无法正常运行
