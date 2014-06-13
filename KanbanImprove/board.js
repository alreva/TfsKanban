// ==UserScript==
// @name       Kanban improve (common)
// @namespace  http://tfs2010.it.volvo.net/
// @version    0.1
// @description  Does the usability improvements over standard SharePoint Kanban board
// @match      http://tfs2010.it.volvo.net:8080/tfs/Global/SEGOT-eCom-VolvoPentaShop/PentaBusiness/_backlogs/board
// @match      http://tfs2010.it.volvo.net:8080/tfs/Global/SEGOT-eCom-VolvoPentaShop/PentaTeam/_backlogs/board
// @match      http://tfs2010.it.volvo.net:8080/tfs/Global/SEGOT-eCom-VolvoPentaShop/PentaTeam/_boards
// @copyright  2014+, Volvo IT
// ==/UserScript==a

(function () {

    var is_focused = true;

    var customStyle =
        ".board-tile.pale {background-color: transparent; border-color: #ddd; color: #ddd}" + 
        ".board-tile.at.pale {background-color: transparent; border-color: #ddd; color: #ddd}" + 
        ".board-tile.cr.pale {background-color: transparent; border-color: #ddd; color: #ddd}" + 
        ".board-tile.expeditor.pale {background-color: transparent; border-color: #ddd; color: #ddd}" +
        ".board-tile.blocked.pale {background-color: transparent; border-color: #ddd; color: #ddd}"
        ;

    function improveBoard() {

        if (!is_focused || ($(".board-tile").length < 1)) {
            setTimeout(improveBoard, 1000);
            return;
        }

        var allIds = [];

        $(".board-tile")
            .each(function () {
                var itemElm = $(this);
                allIds.push(itemElm.attr('data-item-id'));
            });

        console.log("Kanban improve: item ids: " + allIds);

        var oDataValidationToken = $('[name=__RequestVerificationToken]').val();

        $.post(
            "//" + window.location.host + "/tfs/Global/_api/_wit/pageWorkItems",
            {
                workItemIds: "" + allIds,
                fields: "System.Id,System.State,System.TeamProject,System.Title,System.WorkItemType,Volvo.ecomTeam,Microsoft.VSTS.CMMI.Blocked,Volvo.Common.CaseOrigin,Volvo.Common.CaseOriginNumber",
                __RequestVerificationToken: oDataValidationToken
            },
            function (data) {
                $.each(data.rows, function (_, item) {
                    var itemId = item[0];
                    var itemIsBlocked = item[6] || "No";
                    var itemClassification = item[5] || "";
                    var caseId = (item[7] || "") + "|" + (item[8] || "");

                    var $itemElm = $(".board-tile[data-item-id=" + itemId + "]");

                    $itemElm.attr('data-case-id', caseId);

                    setClassBasedOnExpectation($itemElm,
                        ['CRExpedited', 'ATExpedited'], itemClassification,
                        'expediter');

                    setClassBasedOnExpectation($itemElm,
                        "Yes", itemIsBlocked,
                        'blocked');

                    setClassBasedOnExpectation($itemElm,
                        'CR', itemClassification,
                        'cr');

                    setClassBasedOnExpectation($itemElm,
                        'AT', itemClassification,
                        'at');
                });
            });

        setTimeout(improveBoard, 5000);
    }

    function setClassBasedOnExpectation($elm, expected, actual, className) {

        var evaluationResult = false;

        if ($.isArray(expected)) {
            $.each(expected, function (_, elm) {
                evaluationResult |= elm == actual;
            });
        } else {
            evaluationResult = expected == actual;
        }

        if (evaluationResult) {
            $elm.addClass(className);
        } else {
            $elm.removeClass(className);
        }
    }

    function setCaseHighLight() {
        if ($("[data-case-id]").length < 1) {
            setTimeout(setCaseHighLight, 1000);
            return;
        }

        $('[data-case-id]')
            .mouseenter(function (evt) {
                var caseId = $(evt.target).attr('data-case-id') || $(evt.target).closest('[data-case-id]').attr('data-case-id');
                console.log('Mouse enter... case #:' + caseId)

                $("[data-case-id!='" + caseId + "']").addClass('pale')
            })
            .mouseleave(function (evt) {
                $("[data-case-id]").removeClass('pale')
            });
    }

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    $(function () {

        improveBoard();

        setCaseHighLight();

        addGlobalStyle(customStyle);

        $(window)
            .focus(function () { is_focused = true; })
            .blur(function () { is_focused = false; });
    });

})();
