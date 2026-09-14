# 实验室存储台账

这是一个可部署到 GitHub Pages 的实验室物品管理页面。

## 开启云端共享数据

1. 在 Supabase 创建一个新项目。
2. 打开 Supabase 的 SQL Editor，执行 `supabase-schema.sql` 全部内容。
3. 在 Project Settings -> API 中复制 Project URL 和 anon public key。
4. 编辑 `supabase-config.js`：

```js
window.SUPABASE_CONFIG = {
  url: 'https://你的项目.supabase.co',
  anonKey: '你的 anon public key'
};
```

5. 将 `supabase-config.js`、`supabase-schema.sql` 和网页文件一起提交到 GitHub。
6. 等 GitHub Pages 重新部署后，所有打开网页的设备会读写同一个 Supabase 数据库。

如果数据库为空，网页会尝试把当前浏览器已有的 localStorage 记录迁移到云端。迁移成功后，可清理旧的本地数据，但不要在多个浏览器同时首次迁移同一批记录。

## 安全提示

当前 SQL 策略允许匿名用户读写库存数据，适合先验证功能，不适合存放敏感信息。正式使用前应启用 Supabase Auth，并把策略改为只允许已登录用户访问；同时建议将仓库设为私有，或至少不要把真实实验室敏感信息写入公开页面。

未配置 Supabase 时，网页仍会回退到浏览器本地存储。
