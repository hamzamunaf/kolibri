<template>

  <div
    :style="{
      color: $themeTokens.text,
      backgroundColor: $themeTokens.surface,
      width: width,
    }"
    :class="position === 'embedded' ? 'side-panel' : ''"
  >
    <div v-if="topics && topics.length && topicsListDisplayed">
      <div v-for="t in topics" :key="t.id">
        <KRouterLink
          :text="t.title"
          class="side-panel-folder-link"
          :appearanceOverrides="{ color: $themeTokens.text }"
          :to="genContentLink(t.id)"
        />
      </div>
      <KButton
        v-if="more && !topicsLoading"
        appearance="basic-link"
        @click="$emit('loadMoreTopics')"
      >
        {{ coreString('viewMoreAction') }}
      </KButton>
      <KCircularLoader v-if="topicsLoading" />
    </div>
    <div v-else>
      <!-- search by keyword -->
      <h2 class="title">
        {{ $tr('keywords') }}
      </h2>
      <SearchBox
        key="channel-search"
        placeholder="findSomethingToLearn"
        :value="value.keywords || ''"
        @change="val => $emit('input', { ...value, keywords: val })"
      />
      <div v-if="Object.keys(libraryCategoriesList).length">
        <h2 class="section title">
          {{ $tr('categories') }}
        </h2>
        <!-- list of category metadata - clicking prompts a filter modal -->
        <div
          span="4"
          class="category-list-item"
        >
          <KButton
            :text="$tr('allCategories')"
            appearance="flat-button"
            :class="!!activeKeys.filter(k => k.includes('all_categories')).length ? 'active' : ''"
            :appearanceOverrides="customCategoryStyles"
            @click="allCategories"
          />
        </div>

        <div
          v-for="(category, val) in libraryCategoriesList"
          :key="category"
          span="4"
          class="category-list-item"
        >
          <KButton
            :text="coreString(val)"
            appearance="flat-button"
            :appearanceOverrides="customCategoryStyles"
            :disabled="availableRootCategories &&
              !availableRootCategories[val] &&
              !activeKeys.filter(k => k.includes(val)).length"
            :class="!!activeKeys.filter(k => k.includes(val)).length ? 'active' : ''"
            iconAfter="chevronRight"
            @click="$emit('currentCategory', category)"
          />
        </div>
        <div
          span="4"
          class="category-list-item"
        >
          <KButton
            :text="coreString('None of the above')"
            appearance="flat-button"
            :appearanceOverrides="customCategoryStyles"
            :class="!!activeKeys.filter(k => k.includes('no_categories')).length ? 'active' : ''"
            @click="noCategories"
          />
        </div>
      </div>
      <ActivityButtonsGroup
        :availableLabels="availableLabels"
        :activeButtons="activeActivityButtons"
        class="section"
        @input="handleActivity"
      />
      <!-- Filter results by learning activity, displaying all options -->
      <SelectGroup
        v-model="inputValue"
        :availableLabels="availableLabels"
        :showChannels="showChannels"
        class="section"
      />
      <div
        v-if="Object.keys(resourcesNeededList).length"
        class="section"
      >
        <h2 class="title">
          {{ coreString('showResources') }}
        </h2>
        <div
          v-for="(val, activity) in resourcesNeededList"

          :key="activity"
          span="4"
          alignment="center"
        >
          <KCheckbox
            :checked="value.learner_needs[val]"
            :label="coreString(activity)"
            :disabled="availableNeeds && !availableNeeds[val]"
            @change="handleNeed(val)"
          />
        </div>
      </div>
    </div>
  </div>

</template>


<script>

  import pick from 'lodash/pick';
  import uniq from 'lodash/uniq';
  import {
    AllCategories,
    CategoriesLookup,
    NoCategories,
    ResourcesNeededTypes,
  } from 'kolibri.coreVue.vuex.constants';
  import commonCoreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
  import SearchBox from '../SearchBox';
  import commonLearnStrings from '../commonLearnStrings';
  import genContentLink from '../../utils/genContentLink';
  import ActivityButtonsGroup from './ActivityButtonsGroup';
  import SelectGroup from './SelectGroup';
  import plugin_data from 'plugin_data';

  const resourcesNeededShown = ['FOR_BEGINNERS', 'PEOPLE', 'PAPER_PENCIL', 'INTERNET', 'MATERIALS'];

  const resourcesNeeded = {};
  resourcesNeededShown.map(key => {
    const value = ResourcesNeededTypes[key];
    // TODO rtibbles: remove this condition
    if (plugin_data.learnerNeeds.includes(value) || process.env.NODE_ENV !== 'production') {
      resourcesNeeded[key] = value;
    }
  });

  let availableIds;

  if (process.env.NODE_ENV !== 'production') {
    // TODO rtibbles: remove this condition
    availableIds = Object.keys(CategoriesLookup);
  } else {
    availableIds = plugin_data.categories;
  }

  const libraryCategories = pick(
    CategoriesLookup,
    uniq(availableIds.map(key => key.split('.')[0]))
  );

  export default {
    name: 'EmbeddedSidePanel',
    components: {
      SearchBox,
      ActivityButtonsGroup,
      SelectGroup,
    },
    mixins: [commonLearnStrings, commonCoreStrings],
    props: {
      value: {
        type: Object,
        required: true,
        validator(value) {
          const inputKeys = [
            'learning_activities',
            'learner_needs',
            'channels',
            'accessibility_labels',
            'languages',
            'grade_levels',
          ];
          return inputKeys.every(k => Object.prototype.hasOwnProperty.call(value, k));
        },
      },
      availableLabels: {
        type: Object,
        required: false,
        default: null,
      },
      topics: {
        type: Array,
        default() {
          return [];
        },
      },
      more: {
        type: Object,
        default: null,
      },
      topicsLoading: {
        type: Boolean,
        default: false,
      },
      width: {
        type: [Number, String],
        required: true,
      },
      topicsListDisplayed: {
        type: Boolean,
        required: false,
      },
      position: {
        type: String,
        required: true,
        validator(val) {
          return ['embedded', 'overlay'].includes(val);
        },
      },
      showChannels: {
        type: Boolean,
        default: true,
      },
      activeActivityButtons: {
        type: Object,
        required: false,
        default: null,
      },
      activeCategories: {
        type: Object,
        required: false,
        default: null,
      },
    },
    computed: {
      inputValue: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
        },
      },
      libraryCategoriesList() {
        return libraryCategories;
      },
      resourcesNeededList() {
        return resourcesNeeded;
      },
      customCategoryStyles() {
        return {
          color: this.$themeTokens.text,
          width: '100%',
          border: '2px solid transparent',
          'text-align': this.isRtl ? 'right' : 'left',
          'font-weight': 'normal',
          'text-transform': 'none',
          position: 'relative',
          transition: 'none',
          ':hover': {
            'background-color': 'rgb(235, 210, 235)',
            border: '2px',
            'border-color': `${this.$themeTokens.primary} !important`,
            'border-style': 'solid',
            'border-radius': '4px',
            'line-spacing': '0',
          },
        };
      },
      availableRootCategories() {
        if (this.availableLabels) {
          const roots = {};
          for (let key of this.availableLabels.categories) {
            const root = key.split('.')[0];
            roots[root] = true;
          }
          return roots;
        }
        return null;
      },
      availableNeeds() {
        if (this.availableLabels) {
          const needs = {};
          for (let key of this.availableLabels.learner_needs) {
            const root = key.split('.')[0];
            needs[root] = true;
            needs[key] = true;
          }
          return needs;
        }
        return null;
      },
      activeKeys() {
        return Object.keys(this.activeCategories);
      },
    },
    methods: {
      genContentLink,
      allCategories() {
        this.$emit('input', { ...this.value, categories: { [AllCategories]: true } });
      },
      noCategories() {
        this.$emit('input', { ...this.value, categories: { [NoCategories]: true } });
      },
      handleActivity(activity) {
        let learning_activities;
        if (this.value.learning_activities[activity]) {
          learning_activities = {};
          this.$emit('input', { ...this.value, learning_activities });
        } else if (activity || !this.value.learning_activities[activity]) {
          learning_activities = {
            [activity]: true,
          };
          this.$emit('input', { ...this.value, learning_activities });
        }
      },
      handleNeed(need) {
        if (this.value.learner_needs[need]) {
          const learner_needs = {};
          for (let n in this.value.learner_needs) {
            if (n !== need) {
              learner_needs[n] = true;
            }
          }
          this.$emit('input', { ...this.value, learner_needs });
        } else {
          this.$emit('input', {
            ...this.value,
            learner_needs: { ...this.value.learner_needs, [need]: true },
          });
        }
      },
    },
    $trs: {
      keywords: {
        message: 'Keywords',
        context: 'Section header label in the Library page sidebar.',
      },
      categories: {
        message: 'Categories',
        context: 'Section header label in the Library page sidebar.',
      },
      allCategories: {
        message: 'All categories',
        context: 'Option in the Library page sidebar.',
      },
    },
  };

</script>


<style lang="scss" scoped>

  .side-panel {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    padding: 24px;
    padding-top: 140px;
    overflow-y: scroll;
    font-size: 14px;
    box-shadow: 0 3px 3px 0 #00000040;
  }

  .side-panel-folder-link {
    margin-top: 12px;
    margin-bottom: 12px;
    /deep/ .link-text {
      text-decoration: none !important;
    }
  }

  .section {
    margin-top: 40px;
  }

  .active {
    background-color: rgb(235, 210, 235);
    border: 2px !important;
    border-color: #996189 !important;
    border-style: solid !important;
    border-radius: 4px !important;
  }

  .card-grid {
    margin-top: 40px;
    margin-left: 20px;
  }

  /deep/ .prop-icon {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .title {
    margin-bottom: 16px;
  }

</style>
