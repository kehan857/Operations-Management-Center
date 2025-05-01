# 搜索组件样式规范

## 1. 组件结构

### 1.1 基础搜索区
- 搜索字段选择器（宽度120px）
- 关键词输入框（占据中间主要空间）
- 高级搜索切换按钮（宽度60px）
- 快捷筛选标签（位于搜索框下方）

### 1.2 高级搜索区
- 多维度筛选条件（日期范围、下拉选择等）
- 排序选项下拉框
- 功能按钮：重置、应用筛选、保存、导出

## 2. 页面布局规范

```html
<div class="header-actions">
  <div class="search-wrapper">
    <SearchComponent 
      :search-fields="searchFields"
      :filters="filters"
      :sort-options="sortOptions"
      :quick-filters="quickFilters"
      :enable-export="true"
      @search="handleSearch"
      @filter="handleFilter"
      @export="handleExport"
      @save-filter="handleSaveFilter"
      class="custom-search-component"
    />
  </div>
  <div class="action-wrapper">
    <a-button type="primary" class="add-button">
      <template #icon><PlusOutlined /></template>
      添加
    </a-button>
  </div>
</div>
```

## 3. 标准样式

```css
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .search-wrapper {
    width: 70%;
    max-width: 800px;
  }
  
  .action-wrapper {
    display: flex;
    justify-content: flex-end;
  }
}

.add-button {
  margin-left: 16px;
}

:deep(.custom-search-component) {
  width: 100%;
  
  .ant-input-group {
    display: flex;
    align-items: center;
  }
  
  .ant-input-search {
    width: 100%;
  }
  
  .ant-btn {
    height: 32px;
  }
}
``` 