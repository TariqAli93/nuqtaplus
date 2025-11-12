import { defineStore } from 'pinia';

export const useBackupStore = defineStore('backup', {
  state: () => ({
    backups: [],
    config: null,
    schedules: [],
    loading: false,
    error: null,
  }),
  actions: {
    async loadAll() {
      try {
        this.loading = true;
        this.config = await window.electronAPI.backups.getConfig();
        this.backups = await window.electronAPI.backups.list();
        this.schedules = await window.electronAPI.backups.listSchedules();
      } catch (e) {
        this.error = e.message || String(e);
      } finally {
        this.loading = false;
      }
    },
    async createBackup({ name, sourcePaths, passphrase }) {
      // Convert to plain objects to avoid cloning errors
      const plainData = {
        name,
        sourcePaths: Array.isArray(sourcePaths) ? [...sourcePaths] : sourcePaths,
        passphrase,
      };
      const meta = await window.electronAPI.backups.create(plainData);
      this.backups.unshift(meta);
      return meta;
    },
    async deleteBackup(id) {
      await window.electronAPI.backups.delete(id);
      this.backups = this.backups.filter((b) => b.id !== id);
    },
    async restoreBackup({ id, destinationPaths, passphrase }) {
      // Convert to plain objects to avoid cloning errors
      const plainData = {
        id,
        destinationPaths: Array.isArray(destinationPaths)
          ? [...destinationPaths]
          : destinationPaths,
        passphrase,
      };
      return await window.electronAPI.backups.restore(plainData);
    },
    async updateConfig(partial) {
      // Convert to plain object to avoid cloning errors
      const plainConfig = JSON.parse(JSON.stringify(partial));
      this.config = await window.electronAPI.backups.setConfig(plainConfig);
    },
    async addSchedule(params) {
      // Convert to plain objects to avoid cloning errors
      const plainParams = {
        cron: params.cron,
        name: params.name,
        sourcePaths: Array.isArray(params.sourcePaths)
          ? [...params.sourcePaths]
          : params.sourcePaths,
        passphrase: params.passphrase,
      };
      const s = await window.electronAPI.backups.addSchedule(plainParams);
      this.schedules.push(s);
    },
    async removeSchedule(id) {
      await window.electronAPI.backups.removeSchedule(id);
      this.schedules = this.schedules.filter((s) => s.id !== id);
    },
  },
});
