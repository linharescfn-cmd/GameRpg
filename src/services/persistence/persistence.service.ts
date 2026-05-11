/**
 * @fileoverview Persistence Service
 * Gerencia carregamento, salvamento e sincronização de campanhas
 */

import type { Campaign, CampaignMetadata, ApiResponse } from '../types/index.js';

const CAMPAIGNS_PATH = '/data';

class PersistenceService {
  /**
   * Carrega uma campanha por arquivo
   */
  async loadCampaign(filename: string): Promise<Campaign> {
    try {
      const response = await fetch(`${CAMPAIGNS_PATH}/${filename}`);
      if (!response.ok) {
        throw new Error(`Falha ao carregar campanha: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[PersistenceService] Erro ao carregar campanha:', error);
      throw error;
    }
  }

  /**
   * Lista todas as campanhas disponíveis
   */
  async listCampaigns(): Promise<CampaignMetadata[]> {
    try {
      // Para ambientes sem servidor, procura por arquivos conhecidos
      const files = ['campaign1.json', 'campaign2.json'];
      const campaigns: CampaignMetadata[] = [];

      for (const filename of files) {
        try {
          const response = await fetch(`${CAMPAIGNS_PATH}/${filename}`);
          if (response.ok) {
            const data = await response.json();
            campaigns.push({
              filename,
              name: data.name || filename,
              lastModified: Date.now(),
            });
          }
        } catch {
          // Arquivo não encontrado, continua
        }
      }

      return campaigns;
    } catch (error) {
      console.error('[PersistenceService] Erro ao listar campanhas:', error);
      return [];
    }
  }

  /**
   * Salva uma campanha
   */
  async saveCampaign(
    filename: string,
    campaign: Campaign
  ): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${CAMPAIGNS_PATH}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign, null, 2),
      });

      if (!response.ok) {
        throw new Error(`Falha ao salvar campanha: ${response.statusText}`);
      }

      return {
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[PersistenceService] Erro ao salvar campanha:', error);
      return {
        success: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Salva estado do jogo em sessionStorage
   */
  saveGameSession(gameData: any): void {
    try {
      sessionStorage.setItem('loadedGameData', JSON.stringify(gameData));
    } catch (error) {
      console.error('[PersistenceService] Erro ao salvar sessão:', error);
    }
  }

  /**
   * Carrega estado do jogo de sessionStorage
   */
  loadGameSession(): any | null {
    try {
      const data = sessionStorage.getItem('loadedGameData');
      if (data) {
        sessionStorage.removeItem('loadedGameData');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('[PersistenceService] Erro ao carregar sessão:', error);
      return null;
    }
  }

  /**
   * Exporta campanha como JSON
   */
  exportCampaign(campaign: Campaign, filename?: string): void {
    const dataStr = JSON.stringify(campaign, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${campaign.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Importa campanha de arquivo JSON
   */
  async importCampaign(file: File): Promise<Campaign> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const campaign = JSON.parse(e.target?.result as string);
          resolve(campaign);
        } catch (error) {
          reject(new Error('Arquivo JSON inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }
}

export const persistenceService = new PersistenceService();
