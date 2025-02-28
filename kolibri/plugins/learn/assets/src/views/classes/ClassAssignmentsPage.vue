<template>

  <div>
    <h1 class="classroom-name">
      <KLabeledIcon icon="classes" :label="className" />
    </h1>

    <AssignedLessonsCards :lessons="activeLessons" />
    <AssignedQuizzesCards :quizzes="activeQuizzes" :style="{ marginTop: '44px' }" />

  </div>

</template>


<script>

  import { computed, onBeforeMount, onBeforeUnmount } from 'kolibri.lib.vueCompositionApi';
  import { get } from '@vueuse/core';

  import useLearnerResources from '../../composables/useLearnerResources';
  import AssignedQuizzesCards from './AssignedQuizzesCards';
  import AssignedLessonsCards from './AssignedLessonsCards';

  export default {
    name: 'ClassAssignmentsPage',
    metaInfo() {
      return {
        title: this.$tr('documentTitle'),
      };
    },
    components: {
      AssignedQuizzesCards,
      AssignedLessonsCards,
    },
    setup(_, { root }) {
      const {
        fetchClass,
        getClass,
        getClassActiveLessons,
        getClassActiveQuizzes,
      } = useLearnerResources();

      const classId = root.$router.currentRoute.params.classId;
      const classroom = computed(() => getClass(classId));
      const className = computed(() => (get(classroom) ? get(classroom).name : ''));
      const activeLessons = computed(() => getClassActiveLessons(get(classId)));
      const activeQuizzes = computed(() => getClassActiveQuizzes(get(classId)));

      function schedulePoll() {
        const timeoutId = setTimeout(pollForUpdates, 30000);
        return timeoutId;
      }

      function pollForUpdates() {
        fetchClass({ classId, force: true }).then(() => {
          schedulePoll();
        });
      }

      let pollTimeoutId;

      onBeforeMount(() => {
        pollTimeoutId = schedulePoll();
      });

      onBeforeUnmount(() => {
        clearTimeout(pollTimeoutId);
      });

      return {
        className,
        activeLessons,
        activeQuizzes,
      };
    },
    $trs: {
      documentTitle: {
        message: 'Class assignments',
        context:
          'Page/tab title displayed for the Learn page when the learner is enrolled in a class. This is where the learners can see the list of lessons and quizzes coaches have opened and made available for them.',
      },
    },
  };

</script>


<style lang="scss" scoped>

  .classroom-name {
    margin-bottom: 32px;
  }

</style>
