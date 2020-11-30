$(function () {
    var table = document.getElementsByClassName("tab-table")[0];
    var data = JSON.parse(atob(document.getElementsByTagName("backend-data")[0].innerHTML));

    var tab = new Tabulator(table, {
        layout: "fitDataFill",
        columns: [{
                title: "Id",
                field: "id"
            },
            {
                title: "Name",
                field: "name"
            },            {
                title: "Ist Admin",
                field: "isadmin",
                formatter: cell => cell.getData().isadmin ? "<i class='fa fa-check'/>" : "<i class='fa fa-times'/>"
            },
            {
                title: "",
                formatter: function(cell) {
                    return `
                    <a class="btn btn-sm btn-danger mr-1" onclick="(confirm('Sicher') ? function () { window.location.href = '/user/delete/${cell.getData().id}' } : function() {}) ()"><i class="fa fa-trash"></i></a>
                    <a class="btn btn-sm btn-success mr-1" href="/user/editPw/${cell.getData().id}"><i class="fa fa-key"></i></a>
                    <a class="btn btn-sm btn-primary" href="/user/edit/${cell.getData().id}"><i class="fa fa-edit"></i></a>
                    `
                },
                headerSort: false,
                hozAlign: "right",
                minWidth: "150px",
            }
        ]
    });
    tab.addData(data);
})