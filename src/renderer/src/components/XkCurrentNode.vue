<template>
  <a-form>
    <a-form-item label="名称">
      <a-textarea v-model:value="currentNode.name" />
    </a-form-item>
    <a-form-item label="描述">
      <a-textarea v-model:value="currentNode.des" />
    </a-form-item>
    <a-form-item label="所属类目">
      <a-select v-model:value="currentNode.category" placeholder="请选择类目" style="width: 200px"
                :options="categoryItems.map(item => ({ value: item }))">
        <template #dropdownRender="{ menuNode: menu }">
          <v-nodes :vnodes="menu" />
          <a-divider style="margin: 4px 0" />
          <a-space style="padding: 4px 8px">
            <a-input ref="inputRef" v-model:value="categoryName" placeholder="类目名" />
            <a-button type="text" @click="addCategory">
              <template #icon>
                <plus-outlined />
              </template>
              新增类目
            </a-button>
          </a-space>
        </template>
      </a-select>
    </a-form-item>
    <a-form-item label="节点大小">
      <a-input-number v-model:value="currentNode.symbolSize" :min="1" :max="100" />
    </a-form-item>
    <a-form-item>
      <a-button @click="currentNodeSubmit">修改节点</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { defineComponent, ref } from 'vue'
import { jsonReactive } from '../utils/XkUtils'

const currentNode = defineModel('currentNode')
const categoryItems = defineModel('categoryItems')
const categoryName = defineModel('categoryName')
const currentNodeDataIndex = defineModel('currentNodeDataIndex')

const xkContext = defineModel('xkContext')

const inputRef = ref()

const addCategory = e => {
  e.preventDefault()
  console.log(categoryName.value)
  if (categoryName.value) {
    currentNode.value.category = categoryName.value
    if (!categoryItems.value.includes(categoryName.value)) {
      categoryItems.value.push(categoryName.value)
    }
  }
  categoryName.value = ''
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}

const VNodes = defineComponent({
  props: {
    vnodes: {
      type: Object,
      required: true
    }
  },
  render() {
    return this.vnodes
  }
})

const currentNodeSubmit = () => {
  /**
   * 实现节点的动态修改
   */
  const { data, links } = xkContext.value.chartData.series[0]
  const oldNode = jsonReactive(data[currentNodeDataIndex.value])
  const newNode = jsonReactive(currentNode.value)
  const oldName = oldNode.name
  const newName = newNode.name

  if (oldName !== newName) {
    // 修改节点的时候修改了节点名称
    // names.slice(0, currentNodeDataIndex.value).push(...names.slice(currentNodeDataIndex.value + 1)); // 去掉旧节点名称
    // 思考：为什么不需要去掉旧的节点名称？因为本身就不重名，所以不用去掉
    // 思考：两个if是否可以合并？不可以合并，因为第二个if还有else分支
    const hasDuplicate = data.some(node => node.name === newName)
    if (hasDuplicate) {
      xkContext.value.errorMessage = '不能创建同名节点'
      return
    }

    // 修改新节点所在的边
    links.forEach(link => {
      if (link.source === oldName) link.source = newName
      if (link.target === oldName) link.target = newName
    })
  }

  data[currentNodeDataIndex.value] = newNode

  xkContext.value.historyList[xkContext.value.historySequenceNumber + 1] = {
    'act': 'changeNode',
    'old': oldNode,
    'new': newNode
  }
  xkContext.value.historySequenceNumber++

  xkContext.value.updateChart = !xkContext.value.updateChart
  xkContext.value.errorMessage = ''
}
</script>


<style scoped>

</style>
