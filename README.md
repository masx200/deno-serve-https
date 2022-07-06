# deno-serve-https

#### 介绍

deno-serve-https

#### 软件架构

对于`deno`的低级`api`的封装,可以启动同时支持`http/1.1`和`http/2`的`https`服务,并且在一个端口上同时支持了`http`连接升级,`websocket`,`connect`方法和普通请求.

### 与标准库的函数的区别:

1. `alpnProtocols`:目前是`unstable`的`api`.

2. 由于`http/2`中每个请求都是独立并发的,而`http/1`中每个`http`升级请求都是阻塞连接的,所以请求的处理方式会有所不同.

3. 把`connect`方法的请求,升级`upgrade`的请求,普通请求`request`拆分成三个处理函数.

4.可以获取到`http`请求的`alpnProtocol`来判断是否是`http/2`请求.

#### 使用说明
