angular.module('pdfExamApp', ['ui.sortable'])
  .controller('ExamController', ['$scope', '$http', '$timeout', '$window', 
    function($scope, $http, $timeout, $window) {
    
    // Khởi tạo dữ liệu ứng dụng
    $scope.app = {
      name: 'Exam Generator Pro',
      version: '2.0.0'
    };
    
    $scope.currentDate = new Date();
    $scope.currentYear = new Date().getFullYear();

    // Model đề thi
    $scope.exam = {
      id: Date.now(),
      title: 'Đề Thi Mẫu Tiếng Anh',
      subject: 'Tiếng Anh',
      duration: 60,
      instructions: 'Chọn đáp án đúng nhất cho mỗi câu hỏi. Câu hỏi có thể có một hoặc nhiều đáp án đúng.',
      showAnswerKey: true,
      showHiddenQuestions: false,
      questions: []
    };

    // Cấu hình AI
    $scope.aiConfig = {
      topic: 'hello',
      file: null,
      fileName: '',
      totalQuestions: 10,
      levelDistribution: {
        easy: 3,
        medium: 5,
        hard: 2
      },
      typeDistribution: {
        reading: 2,
        grammar: 3,
        vocabulary: 3,
        listening: 2
      },
      duration: 60,
      overwriteExisting: true
    };

    // Trạng thái UI
    $scope.ui = {
      isLoading: false,
      loadingMessage: '',
      uploadProgress: 0,
      activeTab: 'questions',
      alerts: [],
      stats: {
        totalQuestions: 0,
        totalOptions: 0,
        multipleChoiceCount: 0,
        multipleChoicePercent: 0,
        visibleQuestions: 0,
        hiddenQuestions: 0
      },
      editingTemplateId: null,
      editingTemplateName: ''
    };

    // Templates
    $scope.templates = [];

    // Arrange View Data
    $scope.arrangeQuestions = [];
    $scope.arrangeSortableOptions = {
        handle: '.drag-handle',
        placeholder: 'ui-sortable-placeholder',
        forcePlaceholderSize: true,
        cursor: 'move',
        opacity: 0.7
    };

    // ================ KHỞI TẠO ================
    
    $scope.init = function() {
      $scope.loadTemplates();
      $scope.addSampleQuestions();
      $scope.calculateStats();
      $scope.updatePreview();
    };

    // ================ QUẢN LÝ CÂU HỎI ================
    
    $scope.addQuestion = function() {
      var newQuestion = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        text: '',
        type: 'grammar',
        difficulty: 'medium',
        isMultipleChoice: false,
        isHidden: false,
        explanation: '',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: true },
          { text: '', isCorrect: false }
        ]
      };
      
      $scope.exam.questions.push(newQuestion);
      $scope.calculateStats();
      $scope.updatePreview();
      $scope.showAlert('Đã thêm câu hỏi mới', 'success');
      
      $timeout(function() {
        var textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
          textareas[textareas.length - 1].focus();
        }
      }, 100);
      
      return newQuestion;
    };

    $scope.addSampleQuestions = function() {
      if ($scope.exam.questions.length === 0) {
        var q1 = {
          id: 'q_' + Date.now() + '_1',
          text: 'Which of the following are programming languages?',
          type: 'grammar',
          difficulty: 'medium',
          isMultipleChoice: true,
          isHidden: false,
          explanation: 'Python và JavaScript là ngôn ngữ lập trình, HTML và CSS là ngôn ngữ đánh dấu.',
          options: [
            { text: 'Python', isCorrect: true },
            { text: 'HTML', isCorrect: false },
            { text: 'JavaScript', isCorrect: true },
            { text: 'CSS', isCorrect: false },
            { text: 'PHP', isCorrect: true }
          ]
        };
        
        var q2 = {
          id: 'q_' + Date.now() + '_2',
          text: 'What is the capital of France?',
          type: 'vocabulary',
          difficulty: 'easy',
          isMultipleChoice: false,
          isHidden: false,
          explanation: 'Paris is the capital and most populous city of France.',
          options: [
            { text: 'London', isCorrect: false },
            { text: 'Berlin', isCorrect: false },
            { text: 'Paris', isCorrect: true },
            { text: 'Madrid', isCorrect: false }
          ]
        };
        
        var q3 = {
          id: 'q_' + Date.now() + '_3',
          text: 'According to the passage, what is the main idea?',
          type: 'reading',
          difficulty: 'hard',
          isMultipleChoice: false,
          isHidden: false,
          explanation: 'The passage discusses the impact of technology on modern education.',
          options: [
            { text: 'History of computers', isCorrect: false },
            { text: 'Technology in education', isCorrect: true },
            { text: 'Future of transportation', isCorrect: false },
            { text: 'Medical advancements', isCorrect: false }
          ]
        };
        
        var q4 = {
          id: 'q_' + Date.now() + '_4',
          text: 'What did the speaker mention about the weather?',
          type: 'listening',
          difficulty: 'medium',
          isMultipleChoice: true,
          isHidden: false,
          explanation: 'The speaker said it would be sunny in the morning and rainy in the afternoon.',
          options: [
            { text: 'Sunny in the morning', isCorrect: true },
            { text: 'Snowing all day', isCorrect: false },
            { text: 'Cloudy evening', isCorrect: false },
            { text: 'Rainy in the afternoon', isCorrect: true }
          ]
        };
        
        $scope.exam.questions.push(q1, q2, q3, q4);
        $scope.showAlert('Đã thêm 4 câu hỏi mẫu', 'info');
      }
    };

    $scope.countCorrectOptions = function(question) {
      if (!question.options) return 0;
      return question.options.filter(opt => opt.isCorrect).length;
    };

    $scope.removeQuestion = function(questionId) {
      var index = $scope.exam.questions.findIndex(q => q.id === questionId);
      if (index !== -1) {
        $scope.exam.questions.splice(index, 1);
        $scope.calculateStats();
        $scope.updatePreview();
        $scope.showAlert('Đã xóa câu hỏi', 'info');
      }
    };

    $scope.duplicateQuestion = function(question) {
      var duplicated = angular.copy(question);
      duplicated.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      duplicated.text = duplicated.text + ' (Bản sao)';
      $scope.exam.questions.push(duplicated);
      $scope.calculateStats();
      $scope.updatePreview();
      $scope.showAlert('Đã sao chép câu hỏi', 'success');
    };

    $scope.moveQuestionUp = function(index) {
      if (index > 0) {
        var temp = $scope.exam.questions[index];
        $scope.exam.questions[index] = $scope.exam.questions[index - 1];
        $scope.exam.questions[index - 1] = temp;
        $scope.updatePreview();
      }
    };

    $scope.moveQuestionDown = function(index) {
      if (index < $scope.exam.questions.length - 1) {
        var temp = $scope.exam.questions[index];
        $scope.exam.questions[index] = $scope.exam.questions[index + 1];
        $scope.exam.questions[index + 1] = temp;
        $scope.updatePreview();
      }
    };

    // ================ XỬ LÝ KHI CHUYỂN ĐỔI MULTIPLE/SINGLE ================
    $scope.onMultipleChoiceToggle = function(question) {
      // Nếu chuyển từ multiple (true) sang single (false), chỉ giữ lại đáp án đúng đầu tiên
      if (!question.isMultipleChoice) {
        var firstCorrectIndex = -1;
        for (var i = 0; i < question.options.length; i++) {
          if (question.options[i].isCorrect) {
            firstCorrectIndex = i;
            break;
          }
        }
        // Đặt tất cả là sai, chỉ giữ lại cái đầu tiên (nếu có)
        angular.forEach(question.options, function(opt, idx) {
          opt.isCorrect = (idx === firstCorrectIndex);
        });
      }
      $scope.updatePreview();
    };

    // ================ TÍNH NĂNG ẨN/HIỆN CÂU HỎI ================
    
    $scope.toggleQuestionVisibility = function(question) {
      question.isHidden = !question.isHidden;
      $scope.calculateStats();
      $scope.updatePreview();
      $scope.showAlert(
        question.isHidden ? 'Đã ẩn câu hỏi' : 'Đã hiện câu hỏi',
        question.isHidden ? 'info' : 'success'
      );
    };

    $scope.getVisibleQuestionsCount = function() {
      return $scope.exam.questions.filter(q => !q.isHidden).length;
    };

    $scope.getHiddenQuestionsCount = function() {
      return $scope.exam.questions.filter(q => q.isHidden).length;
    };

    // ================ THỐNG KÊ ================
    
    $scope.getDifficultyCount = function(difficulty) {
      return $scope.exam.questions.filter(q => q.difficulty === difficulty && !q.isHidden).length;
    };

    $scope.getTypeCount = function(type) {
      return $scope.exam.questions.filter(q => q.type === type && !q.isHidden).length;
    };

    $scope.getTypePercentage = function(type) {
      var visibleCount = $scope.getVisibleQuestionsCount();
      if (visibleCount === 0) return 0;
      return ($scope.getTypeCount(type) / visibleCount) * 100;
    };

    // ================ QUẢN LÝ OPTION ================
    
    $scope.addOption = function(question) {
      if (question.options.length < 10) {
        question.options.push({ text: '', isCorrect: false });
        $scope.calculateStats();
        $scope.updatePreview();
      }
    };

    $scope.removeOption = function(question, optionIndex) {
      if (question.options.length > 2) {
        question.options.splice(optionIndex, 1);
        $scope.calculateStats();
        $scope.updatePreview();
      }
    };

    $scope.getOptionLetter = function(index) {
      return String.fromCharCode(65 + index);
    };

    // ================ PREVIEW ================
    
    $scope.updatePreview = function() {
      $scope.calculateStats();
    };

    $scope.printPreview = function() {
      $window.print();
    };

    // Hàm tạo PDF từ preview
    $scope.generatePDF = function() {
      var originalElement = document.getElementById('previewContent');
      if (!originalElement) {
        $scope.showAlert('Không tìm thấy nội dung để xuất PDF', 'danger');
        return;
      }

      // Tạo bản sao và thêm class để định dạng font
      var clone = originalElement.cloneNode(true);
      clone.classList.add('pdf-export-container');
      clone.style.maxHeight = 'none';
      clone.style.overflowY = 'visible';
      clone.style.height = 'auto';
      document.body.appendChild(clone);

      var opt = {
        margin:       0.5,
        filename:     ($scope.exam.title || 'de-thi').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      $scope.ui.isLoading = true;
      $scope.ui.loadingMessage = 'Đang tạo PDF...';

      html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(clone);
        $scope.$apply(() => {
          $scope.ui.isLoading = false;
          $scope.showAlert('Đã tạo PDF thành công', 'success');
        });
      }).catch((error) => {
        document.body.removeChild(clone);
        $scope.$apply(() => {
          $scope.ui.isLoading = false;
          $scope.showAlert('Lỗi khi tạo PDF: ' + error.message, 'danger');
        });
      });
    };

    $scope.downloadPDFFromPreview = function() {
      $scope.updatePreview();
      $scope.generatePDF();
    };

    // ================ THỐNG KÊ ================
    
    $scope.calculateStats = function() {
      var stats = {
        totalQuestions: $scope.exam.questions.length,
        totalOptions: 0,
        multipleChoiceCount: 0,
        multipleChoicePercent: 0,
        visibleQuestions: $scope.getVisibleQuestionsCount(),
        hiddenQuestions: $scope.getHiddenQuestionsCount(),
        typeDistribution: {
          reading: 0,
          grammar: 0,
          vocabulary: 0,
          listening: 0
        },
        difficultyDistribution: {
          easy: 0,
          medium: 0,
          hard: 0
        }
      };
      
      $scope.exam.questions.forEach(function(q) {
        stats.totalOptions += q.options.length;
        if (q.isMultipleChoice) {
          stats.multipleChoiceCount++;
        }
        if (!q.isHidden) {
          if (q.type && stats.typeDistribution[q.type] !== undefined) {
            stats.typeDistribution[q.type]++;
          }
          if (q.difficulty && stats.difficultyDistribution[q.difficulty] !== undefined) {
            stats.difficultyDistribution[q.difficulty]++;
          }
        }
      });
      
      if (stats.totalQuestions > 0) {
        stats.multipleChoicePercent = (stats.multipleChoiceCount / stats.totalQuestions) * 100;
      }
      
      $scope.ui.stats = stats;
    };

    // ================ ARRANGE VIEW ================
    
    $scope.loadArrangeView = function() {
      $scope.arrangeQuestions = angular.copy($scope.exam.questions);
      $scope.calculateStats();
    };

    $scope.applyArrangeOrder = function() {
      if (confirm('Áp dụng thứ tự mới cho đề thi?')) {
        $scope.exam.questions = angular.copy($scope.arrangeQuestions);
        $scope.calculateStats();
        $scope.updatePreview();
        $scope.showAlert('Đã áp dụng thứ tự mới', 'success');
      }
    };

    // Hàm xáo trộn ngẫu nhiên câu hỏi trong arrange view
    $scope.shuffleArrangeQuestions = function() {
      var array = $scope.arrangeQuestions;
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      $scope.showAlert('Đã xáo trộn thứ tự câu hỏi', 'info');
    };

    // Di chuyển lên trong arrange view
    $scope.moveArrangeQuestionUp = function(index) {
      if (index > 0) {
        var temp = $scope.arrangeQuestions[index];
        $scope.arrangeQuestions[index] = $scope.arrangeQuestions[index - 1];
        $scope.arrangeQuestions[index - 1] = temp;
      }
    };

    // Di chuyển xuống trong arrange view
    $scope.moveArrangeQuestionDown = function(index) {
      if (index < $scope.arrangeQuestions.length - 1) {
        var temp = $scope.arrangeQuestions[index];
        $scope.arrangeQuestions[index] = $scope.arrangeQuestions[index + 1];
        $scope.arrangeQuestions[index + 1] = temp;
      }
    };

    $scope.goToQuestion = function(questionId) {
      var index = $scope.exam.questions.findIndex(q => q.id === questionId);
      if (index !== -1) {
        $scope.ui.activeTab = 'questions';
        
        $timeout(function() {
          var element = document.getElementById('question_' + questionId);
          if (!element) {
            var questions = document.querySelectorAll('.question-card');
            if (questions.length > index) {
              questions[index].id = 'question_' + questionId;
              element = questions[index];
            }
          }
          
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.backgroundColor = '#fff3cd';
            $timeout(function() {
              element.style.backgroundColor = '';
            }, 2000);
          }
        }, 100);
      }
    };

    $scope.removeQuestionFromArrange = function(questionId) {
      var index = $scope.arrangeQuestions.findIndex(q => q.id === questionId);
      if (index !== -1) {
        if (confirm('Xóa câu hỏi này?')) {
          $scope.arrangeQuestions.splice(index, 1);
          $scope.showAlert('Đã xóa câu hỏi khỏi danh sách sắp xếp', 'info');
        }
      }
    };

    // ================ ALERTS ================
    
    $scope.showAlert = function(message, type) {
      var alert = {
        id: Date.now(),
        message: message,
        type: type || 'info',
        timestamp: new Date()
      };
      
      $scope.ui.alerts.push(alert);
      
      $timeout(function() {
        $scope.closeAlert(alert.id);
      }, 5000);
    };

    $scope.closeAlert = function(alertId) {
      $scope.ui.alerts = $scope.ui.alerts.filter(a => a.id !== alertId);
    };

    $scope.getAlertIcon = function(type) {
      switch(type) {
        case 'success': return 'check-circle';
        case 'danger': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        default: return 'info-circle';
      }
    };

    // ================ CHUYỂN TAB ================
    $scope.switchToTab = function(tab) {
      $scope.ui.activeTab = tab;
      if (tab === 'preview') {
        $scope.updatePreview();
      } else if (tab === 'arrange') {
        $scope.loadArrangeView();
      }
    };

    // ================ TEMPLATES - QUẢN LÝ MẪU ĐỀ ================
    
    $scope.loadTemplates = function() {
      try {
        var saved = localStorage.getItem('examTemplates');
        if (saved) {
          $scope.templates = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Error loading templates:', e);
        $scope.templates = [];
      }
    };

    $scope.saveTemplate = function() {
      if ($scope.exam.questions.length === 0) {
        $scope.showAlert('Không thể lưu mẫu trống!', 'warning');
        return;
      }

      var templateName = prompt('Tên mẫu:', $scope.exam.title + ' - Mẫu');
      if (!templateName) return;

      var template = {
        id: 'tpl_' + Date.now(),
        name: templateName,
        exam: angular.copy($scope.exam),
        createdAt: new Date().toISOString(),
        questionCount: $scope.exam.questions.length,
        subject: $scope.exam.subject
      };
      
      $scope.templates.push(template);
      $scope.saveTemplatesToStorage();
      $scope.showAlert('Đã lưu mẫu: ' + templateName, 'success');
    };

    $scope.loadTemplate = function(template) {
      if (confirm('Tải mẫu này sẽ thay thế đề thi hiện tại. Tiếp tục?')) {
        $scope.exam = angular.copy(template.exam);
        $scope.exam.id = Date.now();
        $scope.calculateStats();
        $scope.updatePreview();
        $scope.showAlert('Đã tải mẫu: ' + template.name, 'success');
        $scope.ui.activeTab = 'questions';
      }
    };

    $scope.editTemplateContent = function(template, event) {
      event.stopPropagation();
      if (confirm('Chuyển sang tab soạn đề để chỉnh sửa mẫu này?')) {
        $scope.exam = angular.copy(template.exam);
        $scope.exam.id = Date.now();
        $scope.calculateStats();
        $scope.updatePreview();
        $scope.ui.editingTemplateId = template.id;
        $scope.ui.editingTemplateName = template.name;
        $scope.ui.activeTab = 'questions';
        $scope.showAlert('Đang chỉnh sửa mẫu. Nhấn "Cập nhật" để lưu hoặc "Hủy" để thoát.', 'info');
      }
    };

    $scope.cancelEditing = function() {
      $scope.ui.editingTemplateId = null;
      $scope.ui.editingTemplateName = '';
      $scope.showAlert('Đã hủy chỉnh sửa mẫu.', 'info');
    };

    $scope.updateTemplate = function() {
      if (!$scope.ui.editingTemplateId) {
        $scope.showAlert('Không có mẫu nào đang được sửa.', 'warning');
        return;
      }

      var index = $scope.templates.findIndex(t => t.id === $scope.ui.editingTemplateId);
      if (index === -1) {
        $scope.showAlert('Mẫu không tồn tại!', 'danger');
        $scope.ui.editingTemplateId = null;
        $scope.ui.editingTemplateName = '';
        return;
      }

      if (confirm('Cập nhật mẫu với nội dung hiện tại?')) {
        $scope.templates[index].exam = angular.copy($scope.exam);
        $scope.templates[index].questionCount = $scope.exam.questions.length;
        $scope.templates[index].subject = $scope.exam.subject;
        $scope.templates[index].createdAt = new Date().toISOString();
        $scope.saveTemplatesToStorage();
        $scope.showAlert('Đã cập nhật mẫu thành công!', 'success');
        $scope.ui.editingTemplateId = null;
        $scope.ui.editingTemplateName = '';
      }
    };

    $scope.editTemplate = function(template, event) {
      event.stopPropagation();
      
      var newName = prompt('Chỉnh sửa tên mẫu:', template.name);
      if (newName && newName !== template.name) {
        template.name = newName;
        $scope.saveTemplatesToStorage();
        $scope.showAlert('Đã cập nhật tên mẫu', 'success');
      }
    };

    $scope.deleteTemplate = function(templateId, event) {
      if (event) event.stopPropagation();
      
      if (confirm('Xóa mẫu này?')) {
        $scope.templates = $scope.templates.filter(t => t.id !== templateId);
        $scope.saveTemplatesToStorage();
        $scope.showAlert('Đã xóa mẫu', 'info');
        if ($scope.ui.editingTemplateId === templateId) {
          $scope.ui.editingTemplateId = null;
          $scope.ui.editingTemplateName = '';
        }
      }
    };

    $scope.saveTemplatesToStorage = function() {
      try {
        localStorage.setItem('examTemplates', JSON.stringify($scope.templates));
      } catch (e) {
        console.error('Error saving templates:', e);
        $scope.showAlert('Lỗi khi lưu templates', 'danger');
      }
    };

    // Xuất template dưới dạng PDF (giống preview)
    $scope.exportTemplateAsPDF = function(template, event) {
      event.stopPropagation();
      
      // Tạo container tạm thời từ nội dung của template
      var tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-export-container';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '20px';
      tempDiv.style.background = 'white';
      
      // Xây dựng HTML từ template.exam
      var exam = template.exam;
      var html = '<div class="pdf-export-container">';
      html += '<h1 style="font-size:24px; text-align:center; margin-bottom:20px; color:#667eea; border-bottom:2px solid #dee2e6; padding-bottom:10px;">' + (exam.title || 'ĐỀ THI MẪU') + '</h1>';
      html += '<div style="text-align:center; margin-bottom:20px; font-size:14px;">';
      html += '<strong>Môn:</strong> ' + (exam.subject || 'Chưa đặt') + ' &nbsp;|&nbsp; ';
      html += '<strong>Thời gian:</strong> ' + (exam.duration || 60) + ' phút &nbsp;|&nbsp; ';
      html += '<strong>Số câu:</strong> ' + exam.questions.filter(q => !q.isHidden).length;
      html += '</div>';
      
      if (exam.instructions) {
        html += '<div style="background:#e9f7fe; padding:15px; border-radius:8px; margin-bottom:20px; border-left:5px solid #3b82f6; font-size:14px;">';
        html += '<strong>Hướng dẫn:</strong> ' + exam.instructions;
        html += '</div>';
      }
      
      exam.questions.forEach(function(q, index) {
        if (q.isHidden) return;
        html += '<div style="margin-bottom:30px;">';
        html += '<h3 style="font-size:18px; margin:15px 0 10px; color:#2c3e50;">Câu ' + (index+1) + '.</h3>';
        html += '<p style="font-size:14px; margin-bottom:10px; line-height:1.5;">' + (q.text || '') + '</p>';
        html += '<div style="margin-left:20px;">';
        q.options.forEach(function(opt, optIndex) {
          var letter = String.fromCharCode(65 + optIndex);
          var isCorrect = opt.isCorrect && exam.showAnswerKey;
          var bgColor = isCorrect ? ' background:#d4edda; border-left:4px solid #28a745;' : '';
          html += '<div style="margin:8px 0; padding:8px;' + bgColor + '">';
          html += '<span style="display:inline-block; width:25px; height:25px; line-height:25px; text-align:center; background:#e9ecef; border-radius:50%; margin-right:8px; font-weight:bold;">' + letter + '</span>';
          html += '<span style="font-size:14px;">' + (opt.text || '') + '</span>';
          if (isCorrect) {
            html += ' <span style="background:#28a745; color:white; padding:4px 8px; border-radius:12px; font-size:12px; margin-left:8px;">Đúng</span>';
          }
          html += '</div>';
        });
        html += '</div>';
        if (exam.showAnswerKey && q.explanation) {
          html += '<div style="background:#f8f9fa; padding:10px; margin-top:10px; font-size:13px; border-radius:5px;">';
          html += '<strong>Giải thích:</strong> ' + q.explanation;
          html += '</div>';
        }
        html += '</div>';
      });
      
      html += '<div style="text-align:center; margin-top:50px; color:#6c757d; font-size:13px;">--- Hết đề thi ---</div>';
      html += '</div>';
      
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);
      
      var opt = {
        margin:       0.5,
        filename:     template.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, letterRendering: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      $scope.ui.isLoading = true;
      $scope.ui.loadingMessage = 'Đang xuất PDF mẫu...';
      
      $timeout(function() {
        html2pdf().set(opt).from(tempDiv).save().then(() => {
          document.body.removeChild(tempDiv);
          $scope.$apply(() => {
            $scope.ui.isLoading = false;
            $scope.showAlert('Đã xuất PDF mẫu: ' + template.name, 'success');
          });
        }).catch((error) => {
          document.body.removeChild(tempDiv);
          $scope.$apply(() => {
            $scope.ui.isLoading = false;
            $scope.showAlert('Lỗi khi xuất PDF: ' + error.message, 'danger');
          });
        });
      }, 100);
    };

    $scope.importTemplate = function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var template = JSON.parse(e.target.result);
            if (template.id && template.exam) {
              template.id = 'tpl_' + Date.now();
              template.createdAt = new Date().toISOString();
              
              $scope.templates.push(template);
              $scope.saveTemplatesToStorage();
              $scope.showAlert('Đã import mẫu: ' + template.name, 'success');
              $scope.$apply();
            } else {
              $scope.showAlert('File JSON không đúng định dạng template', 'danger');
            }
          } catch (error) {
            $scope.showAlert('Lỗi đọc file JSON: ' + error.message, 'danger');
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    };

    // ================ AI INTEGRATION ================
    
    $scope.handleAIFileUpload = function(files) {
      if (files && files.length > 0) {
        $scope.aiConfig.file = files[0];
        $scope.aiConfig.fileName = files[0].name;
        // Tự động điền topic từ tên file (bỏ phần mở rộng)
        var fileName = files[0].name;
        var lastDot = fileName.lastIndexOf('.');
        if (lastDot !== -1) {
          fileName = fileName.substring(0, lastDot);
        }
        $scope.aiConfig.topic = fileName;
        $scope.$apply();
        $scope.showAlert('Đã chọn file: ' + files[0].name, 'info');
      }
    };

    $scope.clearAIFile = function() {
      $scope.aiConfig.file = null;
      $scope.aiConfig.fileName = '';
      $scope.showAlert('Đã xóa file', 'info');
    };

    // Hàm kiểm tra tổng số trước khi gọi AI
    $scope.validateAIConfigBeforeGenerate = function() {
      var totalDifficulty = ($scope.aiConfig.levelDistribution.easy || 0) +
                            ($scope.aiConfig.levelDistribution.medium || 0) +
                            ($scope.aiConfig.levelDistribution.hard || 0);
      var totalType = ($scope.aiConfig.typeDistribution.reading || 0) +
                      ($scope.aiConfig.typeDistribution.grammar || 0) +
                      ($scope.aiConfig.typeDistribution.vocabulary || 0) +
                      ($scope.aiConfig.typeDistribution.listening || 0);
      
      if (totalDifficulty !== $scope.aiConfig.totalQuestions) {
        $scope.showAlert('Tổng phân bổ độ khó (' + totalDifficulty + ') không bằng tổng số câu (' + $scope.aiConfig.totalQuestions + ')', 'danger');
        return false;
      }
      if (totalType !== $scope.aiConfig.totalQuestions) {
        $scope.showAlert('Tổng phân bổ loại câu hỏi (' + totalType + ') không bằng tổng số câu (' + $scope.aiConfig.totalQuestions + ')', 'danger');
        return false;
      }
      return true;
    };

    $scope.generateWithAI = function() {
      // Kiểm tra thông tin đầu vào
      if (!$scope.aiConfig.file) {
        $scope.showAlert('Vui lòng chọn file PDF!', 'danger');
        return;
      }
      if (!$scope.aiConfig.topic || $scope.aiConfig.topic.trim() === '') {
        $scope.showAlert('Vui lòng nhập Topic / Chủ đề!', 'danger');
        return;
      }

      // Kiểm tra tổng số trước khi gọi API
      if (!$scope.validateAIConfigBeforeGenerate()) {
        return;
      }

      $scope.ui.isLoading = true;
      $scope.ui.loadingMessage = 'AI đang xử lý file PDF...';
      $scope.ui.uploadProgress = 0;
      
      var formData = new FormData();
      
      formData.append('file', $scope.aiConfig.file);
      
      var promptData = {
        topic: $scope.aiConfig.topic || "General Topic",
        totalQuestions: parseInt($scope.aiConfig.totalQuestions),
        levelDistribution: {
          easy: parseInt($scope.aiConfig.levelDistribution.easy),
          medium: parseInt($scope.aiConfig.levelDistribution.medium),
          hard: parseInt($scope.aiConfig.levelDistribution.hard)
        },
        typeDistribution: {
          reading: parseInt($scope.aiConfig.typeDistribution.reading),
          grammar: parseInt($scope.aiConfig.typeDistribution.grammar),
          vocabulary: parseInt($scope.aiConfig.typeDistribution.vocabulary),
          listening: parseInt($scope.aiConfig.typeDistribution.listening)
        },
        duration: parseInt($scope.aiConfig.duration)
      };
      
      var promptString = JSON.stringify(promptData);
      formData.append('prompt', promptString);
      
      var progressInterval = setInterval(function() {
        if ($scope.ui.uploadProgress < 80) {
          $scope.ui.uploadProgress += 5;
          $scope.$apply();
        }
      }, 200);
      
      $http.post('http://localhost:8080/api/rag/ask', formData, {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      }).then(function(response) {
        clearInterval(progressInterval);
        $scope.ui.uploadProgress = 100;
        
        if (response.data && response.data.data) {
          var aiQuestions = response.data.data.questions || response.data.data.response?.questions || [];
          
          if ($scope.exam.questions.length > 0 && $scope.aiConfig.overwriteExisting) {
            if (!confirm('Tạo đề thi mới sẽ xóa câu hỏi hiện tại. Tiếp tục?')) {
              $scope.ui.isLoading = false;
              $scope.ui.uploadProgress = 0;
              return;
            }
          }
          
          if ($scope.aiConfig.overwriteExisting) {
            $scope.exam.questions = [];
          }
          
          for (var i = 0; i < aiQuestions.length; i++) {
            var aiQ = aiQuestions[i];
            var question = {
              id: 'ai_' + Date.now() + '_' + i,
              text: aiQ.question_text || aiQ.text || 'Câu hỏi từ AI ' + (i + 1),
              type: (aiQ.question_type || 'grammar').toLowerCase(),
              difficulty: (aiQ.difficulty || 'medium').toLowerCase(),
              isMultipleChoice: aiQ.isMultipleChoice || Math.random() > 0.5,
              isHidden: false,
              explanation: aiQ.explanation || '',
              options: []
            };
            
            if (!['reading', 'grammar', 'vocabulary', 'listening'].includes(question.type)) {
              question.type = 'grammar';
            }
            
            if (aiQ.options && Array.isArray(aiQ.options)) {
              aiQ.options.forEach(function(opt, idx) {
                question.options.push({
                  text: opt.text || 'Option ' + $scope.getOptionLetter(idx),
                  isCorrect: opt.isCorrect || false
                });
              });
            } else if (aiQ.option_a || aiQ.option_b || aiQ.option_c || aiQ.option_d) {
              if (aiQ.option_a) question.options.push({ text: aiQ.option_a, isCorrect: aiQ.correct_answer === 'A' });
              if (aiQ.option_b) question.options.push({ text: aiQ.option_b, isCorrect: aiQ.correct_answer === 'B' });
              if (aiQ.option_c) question.options.push({ text: aiQ.option_c, isCorrect: aiQ.correct_answer === 'C' });
              if (aiQ.option_d) question.options.push({ text: aiQ.option_d, isCorrect: aiQ.correct_answer === 'D' });
            } else {
              question.options = [
                { text: 'Option A', isCorrect: true },
                { text: 'Option B', isCorrect: false },
                { text: 'Option C', isCorrect: false },
                { text: 'Option D', isCorrect: false }
              ];
            }
            
            $scope.exam.questions.push(question);
          }
          
          if ($scope.aiConfig.topic) {
            $scope.exam.title = $scope.aiConfig.topic + ' Examination';
          }
          
          $scope.calculateStats();
          $scope.updatePreview();
          $scope.showAlert('AI đã tạo thành công ' + aiQuestions.length + ' câu hỏi!', 'success');
          $scope.ui.activeTab = 'questions';
        } else {
          $scope.showAlert('API trả về dữ liệu không đúng định dạng!', 'warning');
        }
      }).catch(function(error) {
        clearInterval(progressInterval);
        console.error('AI Error:', error);
        
        var errorMsg = 'Lỗi khi gửi yêu cầu AI';
        if (error.data) {
          if (error.data.message) {
            errorMsg = error.data.message;
          } else if (error.data.error) {
            errorMsg = error.data.error + ': ' + (error.data.message || '');
          }
        } else if (error.status) {
          errorMsg = 'HTTP ' + error.status + ': ' + (error.statusText || '');
        }
        
        $scope.showAlert(errorMsg, 'danger');
        
        if (confirm('API không khả dụng. Tạo câu hỏi mẫu thay thế?')) {
          var sampleQuestions = $scope.generateSampleAIQuestions();
          if ($scope.aiConfig.overwriteExisting) {
            $scope.exam.questions = sampleQuestions;
          } else {
            $scope.exam.questions = $scope.exam.questions.concat(sampleQuestions);
          }
          $scope.calculateStats();
          $scope.updatePreview();
          $scope.showAlert('Đã tạo ' + sampleQuestions.length + ' câu hỏi mẫu', 'info');
        }
      }).finally(function() {
        $timeout(function() {
          $scope.ui.isLoading = false;
          $scope.ui.uploadProgress = 0;
        }, 500);
      });
    };

    $scope.generateSampleAIQuestions = function() {
      var questions = [];
      var types = ['reading', 'grammar', 'vocabulary', 'listening'];
      var difficulties = ['easy', 'medium', 'hard'];
      
      for (var i = 0; i < ($scope.aiConfig.totalQuestions || 5); i++) {
        var isMultipleChoice = Math.random() > 0.5;
        var question = {
          id: 'ai_' + Date.now() + '_' + i,
          text: 'Câu hỏi AI ' + (i + 1) + ' về ' + types[i % types.length] + '?',
          type: types[i % types.length],
          difficulty: difficulties[i % difficulties.length],
          isMultipleChoice: isMultipleChoice,
          isHidden: false,
          explanation: 'Đây là giải thích được tạo bởi AI cho câu hỏi ' + (i + 1),
          options: []
        };
        
        var optionCount = 4 + (i % 3);
        var correctCount = isMultipleChoice ? (1 + Math.floor(Math.random() * 2)) : 1;
        var correctIndexes = [];
        
        while (correctIndexes.length < correctCount) {
          var idx = Math.floor(Math.random() * optionCount);
          if (!correctIndexes.includes(idx)) {
            correctIndexes.push(idx);
          }
        }
        
        for (var j = 0; j < optionCount; j++) {
          question.options.push({
            text: 'Lựa chọn ' + $scope.getOptionLetter(j) + ' cho câu hỏi ' + (i + 1),
            isCorrect: correctIndexes.includes(j)
          });
        }
        
        questions.push(question);
      }
      
      return questions;
    };

    // ================ UTILITIES ================
    
    $scope.clearAllQuestions = function() {
      if ($scope.exam.questions.length === 0) return;
      
      if (confirm('Xóa tất cả câu hỏi? Thao tác này không thể hoàn tác.')) {
        $scope.exam.questions = [];
        $scope.calculateStats();
        $scope.updatePreview();
        $scope.showAlert('Đã xóa tất cả câu hỏi', 'info');
      }
    };

    // Khởi tạo ứng dụng
    $scope.init();
  }])
  .filter('date', function() {
    return function(input) {
      if (!input) return '';
      var date = new Date(input);
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    };
  });