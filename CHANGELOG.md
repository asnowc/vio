## 0.x

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
