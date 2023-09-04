/**
 * Author: LucianoCirino
 * URL: https://github.com/LucianoCirino/efficiency-nodes-comfyui/tree/main
 */

export default class ExtensionEfficiency {
  id = 'comfymc-efficiency-nodes'
  name = 'Efficiency Nodes'
  version = '1.0.0'
  description = 'Adds efficiency nodes'

  last_ckpt_input_mode = undefined
  last_target_ckpt = undefined

  nodeCreated(node) {
    const data = node.data
    const inputs = data.inputs

    const inputHandlers = {
      'Efficient Loader': {
        lora_name: this.handlers(['lora_model_strength', 'lora_clip_strength']),
      },
      'Eff. Loader SDXL': {
        refiner_ckpt_name: this.handlers([
          'refiner_clip_skip',
          'positive_ascore',
          'negative_ascore',
        ]),
      },
      'LoRA Stacker': {
        input_mode: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
          this.handleVisibility(
            data,
            data.getInterfaceByName('lora_count').value,
            'LoRA Stacker'
          )
        },
        lora_count: (data, input) => {
          this.handleVisibility(data, input.value, 'LoRA Stacker')
        },
      },
      'XY Input: Steps': {
        target_parameter: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
        },
      },
      'XY Input: Sampler/Scheduler': {
        target_parameter: (data, input) => {
          this.handleSamplerSchedulerVisibility(
            data,
            data.getInterfaceByName('input_count').value,
            input.value
          )
        },
        input_count: (data, input) => {
          this.handleSamplerSchedulerVisibility(
            data,
            input.value,
            data.getInterfaceByName('target_parameter').value
          )
        },
      },
      'XY Input: VAE': {
        input_mode: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
          if (input.value === 'VAE Names') {
            this.handleInputVisibility(
              data,
              data.getInterfaceByName('vae_count').value,
              'vae_name_',
              50
            )
          } else {
            this.handleInputVisibility(data, 0, 'vae_name_', 50)
          }
        },
        vae_count: (data, input) => {
          if (data.getInterfaceByName('input_mode').value === 'VAE Names') {
            this.handleInputVisibility(data, input.value, 'vae_name_', 50)
          }
        },
      },
      'XY Input: Prompt S/R': {
        replace_count: (data, input) => {
          this.handleInputVisibility(data, input.value, 'replace_', 49)
        },
      },
      'XY Input: Checkpoint': {
        input_mode: (data, input) => {
          this.xyCkptRefinerOptionsRemove(data, input)
          this.handleInputModeInputsVisibility(data, input)
          this.handleVisibility(
            data,
            data.getInterfaceByName('ckpt_count').value,
            'Checkpoint'
          )
        },
        ckpt_count: (data, input) => {
          this.handleVisibility(data, input.value, 'Checkpoint')
        },
        target_ckpt: (data, input) => {
          this.xyCkptRefinerOptionsRemove(
            data,
            data.getInterfaceByName('input_mode')
          )
        },
      },
      'XY Input: LoRA': {
        input_mode: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
          this.handleVisibility(
            data,
            data.getInterfaceByName('lora_count').value,
            'LoRA'
          )
        },
        lora_count: (data, input) => {
          this.handleVisibility(data, input.value, 'LoRA')
        },
      },
      'XY Input: LoRA Plot': {
        input_mode: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
        },
      },
      'XY Input: LoRA Stacks': {
        node_state: (data, input) => {
          this.toggleInputs(data, data.getInterfaceByName('node_state'), false)
        },
      },
      'XY Input: Control Net': {
        target_parameter: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
        },
      },
      'XY Input: Control Net Plot': {
        plot_type: (data, input) => {
          this.handleInputModeInputsVisibility(data, input)
        },
      },
    }

    for (const i in inputs) {
      const input = inputs[i]
      const handler = inputHandlers[data.name]?.[input.name]
      if (handler) {
        input.on('change', () => {
          handler(data, input)
        })
      }
    }
  }

  handlers(relevantInputs) {
    return (data, input) => {
      this.listenToggleRelevantInputs(data, input, relevantInputs)
    }
  }

  listenToggleRelevantInputs(data, originInput, relevantInputs) {
    relevantInputs.forEach((name) => {
      const relevantInput = data.getInterfaceByName(name)
      if (relevantInput) {
        relevantInput.hidden = originInput.value === 'None'
      }
    })
  }

  toggleInputs(data, input, show) {
    input.hidden = !show
  }

  xyCkptRefinerOptionsRemove(data, input) {
    const target_ckpt = data.getInterfaceByName('target_ckpt').value
    const input_mode = input.value
    if (input_mode === 'Ckpt Names+ClipSkip+VAE' && target_ckpt === 'Refiner') {
      if (this.last_ckpt_input_mode === 'Ckpt Names+ClipSkip') {
        if (this.last_target_ckpt === 'Refiner') {
          input.value = 'Checkpoint Batch'
        } else {
          input.value = 'Ckpt Names+ClipSkip'
        }
      } else if (this.last_ckpt_input_mode === 'Checkpoint Batch') {
        if (this.last_target_ckpt === 'Refiner') {
          input.value = 'Ckpt Names+ClipSkip'
        } else {
          input.value = 'Checkpoint Batch'
        }
      } else if (this.last_ckpt_input_mode !== 'undefined') {
        input.value = this.last_ckpt_input_mode
      } else {
        input.value = 'Ckpt Names'
      }
    } else if (input_mode !== 'Ckpt Names+ClipSkip+VAE') {
      this.last_ckpt_input_mode = input_mode
    }
  }

  handleInputModeInputsVisibility(data, input) {
    const inputModeVisibilityMap = nodeVisibilityMap[data.name]

    if (!inputModeVisibilityMap || !inputModeVisibilityMap[input.value]) return

    for (const key in inputModeVisibilityMap) {
      for (const inputName of inputModeVisibilityMap[key]) {
        const input = data.getInterfaceByName(inputName)
        this.toggleInputs(data, input, true)
      }
    }

    for (const inputName of inputModeVisibilityMap[input.value]) {
      const input = data.getInterfaceByName(inputName)
      this.toggleInputs(data, input, false)
    }
  }

  handleVisibility(data, countValue, mode) {
    const inputModeValue = data.getInterfaceByName('input_mode').value
    const baseNamesMap = {
      LoRA: ['lora_name', 'model_str', 'clip_str'],
      Checkpoint: ['ckpt_name', 'clip_skip', 'vae_name'],
      'LoRA Stacker': ['lora_name', 'model_str', 'clip_str', 'lora_wt'],
    }

    const baseNames = baseNamesMap[mode]

    const isBatchMode = inputModeValue.includes('Batch')
    if (isBatchMode) {
      countValue = 0
    }

    for (let i = 1; i <= 50; i++) {
      const nameInput = data.getInterfaceByName(`${baseNames[0]}_${i}`)
      const firstInput = data.getInterfaceByName(`${baseNames[1]}_${i}`)
      const secondInput = data.getInterfaceByName(`${baseNames[2]}_${i}`)
      const thirdInput =
        mode === 'LoRA Stacker'
          ? data.getInterfaceByName(`${baseNames[3]}_${i}`)
          : null

      if (i <= countValue) {
        this.toggleInputs(data, nameInput, true)

        if (mode === 'LoRA Stacker') {
          if (inputModeValue === 'simple') {
            this.toggleInputs(data, firstInput, false) // model_str
            this.toggleInputs(data, secondInput, false) // clip_str
            this.toggleInputs(data, thirdInput, true) // lora_wt
          } else if (inputModeValue === 'advanced') {
            this.toggleInputs(data, firstInput, true) // model_str
            this.toggleInputs(data, secondInput, true) // clip_str
            this.toggleInputs(data, thirdInput, false) // lora_wt
          }
        } else if (
          inputModeValue.includes('Names+Weights') ||
          inputModeValue.includes('+ClipSkip')
        ) {
          this.toggleInputs(data, firstInput, true)
        }
        if (!inputModeValue.includes('Names') && mode !== 'LoRA Stacker') {
          this.toggleInputs(data, secondInput, true)
        }
      } else {
        this.toggleInputs(data, nameInput, false)
        this.toggleInputs(data, firstInput, false)
        this.toggleInputs(data, secondInput, false)
        if (thirdInput) {
          this.toggleInputs(data, thirdInput, false)
        }
      }
    }
  }

  handleInputVisibility(data, thresholdValue, inputNamePrefix, maxCount) {
    for (let i = 1; i <= maxCount; i++) {
      const input = data.getInterfaceByName(`${inputNamePrefix}${i}`)
      if (input) {
        this.toggleInputs(data, input, i <= thresholdValue)
      }
    }
  }

  handleSamplerSchedulerVisibility(data, countValue, targetParameter) {
    for (let i = 1; i <= 50; i++) {
      const samplerInput = data.getInterfaceByName(`sampler_${i}`)
      const schedulerInput = data.getInterfaceByName(`scheduler_${i}`)

      if (i <= countValue) {
        if (targetParameter === 'sampler') {
          this.toggleInputs(data, samplerInput, true)
          this.toggleInputs(data, schedulerInput, false)
        } else if (targetParameter === 'scheduler') {
          this.toggleInputs(data, samplerInput, false)
          this.toggleInputs(data, schedulerInput, true)
        } else {
          // targetParameter is "sampler & scheduler"
          this.toggleInputs(data, samplerInput, true)
          this.toggleInputs(data, schedulerInput, true)
        }
      } else {
        this.toggleInputs(data, samplerInput, false)
        this.toggleInputs(data, schedulerInput, false)
      }
    }
  }
}

function generateInputNames(baseName, count) {
  return Array.from({ length: count }, (_, i) => `${baseName}_${i + 1}`)
}

const batchInputs = ['batch_path', 'subdirectories', 'batch_sort', 'batch_max']
const xbatchInputs = [
  'X_batch_path',
  'X_subdirectories',
  'X_batch_sort',
  'X_batch_max',
]
const ckptInputs = [...generateInputNames('ckpt_name', 50)]
const clipSkipInputs = [...generateInputNames('clip_skip', 50)]
const vaeNameInputs = [...generateInputNames('vae_name', 50)]
const loraNameInputs = [...generateInputNames('lora_name', 50)]
const loraWtInputs = [...generateInputNames('lora_wt', 50)]
const modelStrInputs = [...generateInputNames('model_str', 50)]
const clipStrInputs = [...generateInputNames('clip_str', 50)]
const xInputs = ['X_batch_count', 'X_first_value', 'X_last_value']
const yInputs = ['Y_batch_count', 'Y_first_value', 'Y_last_value']

const nodeVisibilityMap = {
  'LoRA Stacker': {
    simple: [...modelStrInputs, ...clipStrInputs],
    advanced: [...loraWtInputs],
  },
  'XY Input: Steps': {
    steps: [
      'first_start_step',
      'last_start_step',
      'first_end_step',
      'last_end_step',
      'first_refine_step',
      'last_refine_step',
    ],
    start_at_step: [
      'first_step',
      'last_step',
      'first_end_step',
      'last_end_step',
      'first_refine_step',
      'last_refine_step',
    ],
    end_at_step: [
      'first_step',
      'last_step',
      'first_start_step',
      'last_start_step',
      'first_refine_step',
      'last_refine_step',
    ],
    refine_at_step: [
      'first_step',
      'last_step',
      'first_start_step',
      'last_start_step',
      'first_end_step',
      'last_end_step',
    ],
  },
  'XY Input: VAE': {
    'VAE Names': [...batchInputs],
    'VAE Batch': [...vaeNameInputs, 'vae_count'],
  },
  'XY Input: Checkpoint': {
    'Ckpt Names': [...clipSkipInputs, ...vaeNameInputs, ...batchInputs],
    'Ckpt Names+ClipSkip': [...vaeNameInputs, ...batchInputs],
    'Ckpt Names+ClipSkip+VAE': [...batchInputs],
    'Checkpoint Batch': [
      ...ckptInputs,
      ...clipSkipInputs,
      ...vaeNameInputs,
      'ckpt_count',
    ],
  },
  'XY Input: LoRA': {
    'LoRA Names': [...modelStrInputs, ...clipStrInputs, ...batchInputs],
    'LoRA Names+Weights': [...batchInputs, 'model_strength', 'clip_strength'],
    'LoRA Batch': [
      ...loraNameInputs,
      ...modelStrInputs,
      ...clipStrInputs,
      'lora_count',
    ],
  },
  'XY Input: LoRA Plot': {
    'X: LoRA Batch, Y: LoRA Weight': [
      'lora_name',
      'model_strength',
      'clip_strength',
      'X_first_value',
      'X_last_value',
    ],
    'X: LoRA Batch, Y: Model Strength': [
      'lora_name',
      'model_strength',
      'model_strength',
      'X_first_value',
      'X_last_value',
    ],
    'X: LoRA Batch, Y: Clip Strength': [
      'lora_name',
      'clip_strength',
      'X_first_value',
      'X_last_value',
    ],
    'X: Model Strength, Y: Clip Strength': [
      ...xbatchInputs,
      'model_strength',
      'clip_strength',
    ],
  },
  'XY Input: Control Net': {
    strength: [
      'first_start_percent',
      'last_start_percent',
      'first_end_percent',
      'last_end_percent',
      'strength',
    ],
    start_percent: [
      'first_strength',
      'last_strength',
      'first_end_percent',
      'last_end_percent',
      'start_percent',
    ],
    end_percent: [
      'first_strength',
      'last_strength',
      'first_start_percent',
      'last_start_percent',
      'end_percent',
    ],
  },
  'XY Input: Control Net Plot': {
    'X: Strength, Y: Start%': ['strength', 'start_percent'],
    'X: Strength, Y: End%': ['strength', 'end_percent'],
    'X: Start%, Y: Strength': ['start_percent', 'strength'],
    'X: Start%, Y: End%': ['start_percent', 'end_percent'],
    'X: End%, Y: Strength': ['end_percent', 'strength'],
    'X: End%, Y: Start%': ['end_percent', 'start_percent'],
  },
}
