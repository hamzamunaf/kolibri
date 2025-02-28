import VueRouter from 'vue-router';
import KBreadcrumbs from 'kolibri-design-system/lib/KBreadcrumbs';
import { mount, createLocalVue } from '@vue/test-utils';
import Breadcrumbs from '../../src/views/Breadcrumbs';
import makeStore from '../makeStore';
import { PageNames } from '../../src/constants';
// eslint-disable-next-line import/named
import useChannels, { useChannelsMock } from '../../src/composables/useChannels';

jest.mock('../../src/composables/useChannels');

const localVue = createLocalVue();
localVue.use(VueRouter);

const router = new VueRouter({
  routes: [
    { path: '/recommended', name: PageNames.RECOMMENDED },
    { path: '/library', name: PageNames.LIBRARY },
    {
      path: '/topics/c/:id',
      name: PageNames.TOPICS_CONTENT,
    },
    {
      path: '/topics/t/:id',
      name: PageNames.TOPICS_TOPIC,
    },
  ],
});

function makeWrapper(options = {}) {
  return mount(Breadcrumbs, { ...options, localVue, router });
}

function getElements(wrapper) {
  return {
    breadcrumbs: () => wrapper.findComponent(KBreadcrumbs),
    breadcrumbItems: () => wrapper.findComponent(KBreadcrumbs).props().items,
  };
}

describe('learn page breadcrumbs', () => {
  describe('when in Topic Browsing mode', () => {
    it('shows no breadcrumbs on topics root (i.e. Channels)', () => {
      const store = makeStore({ pageName: PageNames.LIBRARY });
      const wrapper = makeWrapper({ store });
      const { breadcrumbs } = getElements(wrapper);
      expect(breadcrumbs().exists()).toEqual(false);
    });

    it('shows correct breadcrumbs at a Channel', () => {
      const store = makeStore({ pageName: PageNames.TOPICS_TOPIC });
      useChannels.mockImplementation(() =>
        useChannelsMock({
          channelsMap: {
            'channel-1': { id: 'channel-1', root: 'root-1', name: 'Recommended Channel' },
          },
        })
      );
      store.state.topicsTree.topic = {
        title: 'Recommended Channel Root Node',
        ancestors: [],
        channel_id: 'channel-1',
      };
      const wrapper = makeWrapper({ store });
      const { breadcrumbItems } = getElements(wrapper);
      const bcs = breadcrumbItems();
      expect(bcs.length).toEqual(1);
      expect(bcs[0].link).toEqual(undefined);
      expect(bcs[0].text).toEqual('Recommended Channel');
    });

    it('shows correct breadcrumbs at a non-Channel Topic', () => {
      const store = makeStore({ pageName: PageNames.TOPICS_TOPIC });
      useChannels.mockImplementation(() =>
        useChannelsMock({
          channelsMap: {
            'channel-1': { id: 'channel-1', root: 'root-1', name: 'Another Recommended Channel' },
          },
        })
      );
      store.state.topicsTree.topic = {
        title: 'Recommended Topic',
        channel_id: 'channel-1',
        ancestors: [
          { id: 'root-1', title: 'a root node!' },
          { id: 'previous_topic', title: 'Previous Topic' },
        ],
      };
      const wrapper = makeWrapper({ store });
      const { breadcrumbItems } = getElements(wrapper);
      const bcs = breadcrumbItems();
      expect(bcs.length).toEqual(3);
      // Parent Channel Link
      expect(bcs[0].link.name).toEqual(PageNames.TOPICS_TOPIC);
      expect(bcs[0].link.params.id).toEqual('root-1');
      expect(bcs[0].text).toEqual('Another Recommended Channel');
      // Previous Topic Link
      expect(bcs[1].link.name).toEqual(PageNames.TOPICS_TOPIC);
      expect(bcs[1].link.params.id).toEqual('previous_topic');
      expect(bcs[1].text).toEqual('Previous Topic');
      // Topic
      expect(bcs[2].link).toEqual(undefined);
      expect(bcs[2].text).toEqual('Recommended Topic');
    });
  });

  // Not tested
  // breadcrumbs in Lessons Mode
});
